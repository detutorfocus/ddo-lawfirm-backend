// pages/admin/clients/index.tsx
// -- Admin: client lifecycle management (approve pending, activate,
// mark inactive, archive). Implements the PENDING -> ACTIVE ->
// INACTIVE / ARCHIVED workflow from the spec. Backed by
// admin.getClients / admin.updateClientStatus.

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;
type ClientStatus = typeof STATUS_OPTIONS[number];

const statusStyle: Record<ClientStatus, { bg: string; color: string }> = {
  PENDING:  { bg: "#fff8e1", color: "#f57f17" },
  ACTIVE:   { bg: "#e8f5e9", color: "#2e7d32" },
  INACTIVE: { bg: "#f5f5f5", color: "#757575" },
  ARCHIVED: { bg: "#fce4ec", color: "#c62828" },
};

export default function AdminClientsPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useContext();
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "">("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const { data, isLoading } = trpc.admin.getClients.useQuery(
    { status: statusFilter || undefined, search: search || undefined, page, pageSize: 20 },
    { enabled: isAuthenticated }
  );

  const updateStatus = trpc.admin.updateClientStatus.useMutation({
    onSuccess: () => { utils.admin.getClients.invalidate(); showToast("Client status updated."); },
    onError: (err) => showToast(`Error: ${err.message}`),
  });

  return (
    <>
      <Head><title>Clients — Admin · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--color-dark)", color: "white", padding: "12px 18px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid var(--color-gold)" }}>
          {toast}
        </div>
      )}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Client Management</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} clients</p>
          </div>

          {/* Status filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["", ...STATUS_OPTIONS].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s as ClientStatus | ""); setPage(1); }}
                className="btn"
                style={{ fontSize: "0.78rem", padding: "0.45rem 1rem",
                  background: statusFilter === s ? "var(--color-dark)" : "white",
                  color: statusFilter === s ? "var(--color-gold)" : "var(--color-mid)",
                  border: `1px solid ${statusFilter === s ? "var(--color-dark)" : "var(--color-border)"}`,
                }}>
                {s === "" ? "All" : s}
              </button>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 16, padding: "0.875rem 1.25rem" }}>
            <input className="form-input" placeholder="Search by name, email, company, or client number..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
            ) : data?.clients?.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <p style={{ color: "var(--color-light)", fontFamily: "var(--font-serif)" }}>No clients found for this filter.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Client</th><th>Contact</th><th>Company</th><th>Cases</th><th>Registered</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {data?.clients?.map((c: any) => {
                      const sb = statusStyle[(c.status ?? "PENDING") as ClientStatus];
                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.user.firstName} {c.user.lastName}</div>
                            <div style={{ color: "var(--color-gold)", fontSize: "0.72rem", fontFamily: "monospace" }}>{c.clientNumber}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.82rem" }}>{c.user.email}</div>
                            <div style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>{c.user.phone ?? "—"}</div>
                          </td>
                          <td style={{ fontSize: "0.82rem", color: "var(--color-mid)" }}>{c.companyName ?? "—"}</td>
                          <td>
                            <span style={{ background: "rgba(201,168,76,0.12)", color: "#8B7536", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                              {c._count?.cases ?? 0}
                            </span>
                          </td>
                          <td style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>
                            {new Date(c.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td>
                            <span style={{ background: sb.bg, color: sb.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                              {c.status ?? "PENDING"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {c.status === "PENDING" && (
                                <button className="btn btn-primary" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem" }}
                                  onClick={() => updateStatus.mutate({ clientId: c.id, status: "ACTIVE" })}
                                  disabled={updateStatus.isLoading}>
                                  Approve
                                </button>
                              )}
                              {c.status === "ACTIVE" && (
                                <button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem" }}
                                  onClick={() => updateStatus.mutate({ clientId: c.id, status: "INACTIVE" })}
                                  disabled={updateStatus.isLoading}>
                                  Mark Inactive
                                </button>
                              )}
                              {c.status === "INACTIVE" && (
                                <button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem", color: "#2e7d32" }}
                                  onClick={() => updateStatus.mutate({ clientId: c.id, status: "ACTIVE" })}
                                  disabled={updateStatus.isLoading}>
                                  Reactivate
                                </button>
                              )}
                              {c.status !== "ARCHIVED" && (
                                <button className="btn btn-ghost" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem", color: "#c62828" }}
                                  onClick={() => { if (window.confirm("Archive this client? They will no longer appear in active lists.")) updateStatus.mutate({ clientId: c.id, status: "ARCHIVED" }); }}
                                  disabled={updateStatus.isLoading}>
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span style={{ color: "var(--color-mid)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>Page {page} of {data.totalPages}</span>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

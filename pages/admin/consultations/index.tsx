// pages/admin/consultations/index.tsx
// ── Admin: review, assign and update consultation requests from website

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePagination } from "@/hooks/index";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "CONVERTED", "REJECTED"] as const;
type ConsultStatus = typeof STATUS_OPTIONS[number];

const statusStyle: Record<ConsultStatus, { bg: string; color: string }> = {
  NEW:       { bg: "#e3f2fd", color: "#1565c0" },
  CONTACTED: { bg: "#fff8e1", color: "#f57f17" },
  CONVERTED: { bg: "#e8f5e9", color: "#2e7d32" },
  REJECTED:  { bg: "#fce4ec", color: "#c62828" },
};

export default function AdminConsultationsPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination(1, 20);
  const [statusFilter, setStatusFilter] = useState<ConsultStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const utils = trpc.useContext();

  const { data, isLoading } = trpc.public.getConsultations.useQuery(
    { page, pageSize, status: statusFilter || undefined },
    { enabled: isAuthenticated }
  );

  const updateStatus = trpc.admin.updateConsultationStatus.useMutation({
    onSuccess: () => {
      utils.public.getConsultations.invalidate();
      setSelectedId(null);
      setNoteInput("");
    },
  });

  const selectedConsult = data?.consultations?.find((c) => c.id === selectedId);

  return (
    <>
      <Head><title>Consultations — Admin · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Consultation Requests</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} total requests</p>
          </div>

          {/* Status filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {["", ...STATUS_OPTIONS].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s as ConsultStatus | ""); setPage(1); }}
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

          <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 1fr" : "1fr", gap: 20 }}>
            {/* Consultations list */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {isLoading ? (
                <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
              ) : data?.consultations?.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center" }}>
                  <p style={{ color: "var(--color-light)", fontFamily: "var(--font-serif)" }}>No consultation requests found.</p>
                </div>
              ) : (
                data?.consultations?.map((c) => {
                  const sb = statusStyle[c.status as ConsultStatus] ?? { bg: "#f5f5f5", color: "#555" };
                  const isSelected = selectedId === c.id;
                  return (
                    <div key={c.id}
                      onClick={() => { setSelectedId(isSelected ? null : c.id); setNoteInput(c.notes ?? ""); }}
                      style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)", cursor: "pointer",
                        background: isSelected ? "rgba(201,168,76,0.06)" : "white",
                        borderLeft: isSelected ? "3px solid var(--color-gold)" : "3px solid transparent",
                        transition: "all 0.15s",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                            <span style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", color: "var(--color-dark)", fontWeight: 600 }}>{c.fullName}</span>
                            <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "0.6rem" }}>{c.status}</span>
                          </div>
                          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                            <span style={{ color: "var(--color-gold)", fontSize: "0.75rem" }}>✉️ {c.email}</span>
                            <span style={{ color: "var(--color-mid)", fontSize: "0.75rem" }}>📞 {c.phone}</span>
                            {c.serviceNeeded && <span style={{ color: "var(--color-mid)", fontSize: "0.75rem" }}>⚖️ {c.serviceNeeded}</span>}
                          </div>
                          {c.message && (
                            <p style={{ color: "var(--color-mid)", fontSize: "0.78rem", marginTop: 6, lineHeight: 1.5,
                              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {c.message}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ color: "var(--color-light)", fontSize: "0.72rem" }}>
                            {new Date(c.createdAt).toLocaleDateString("en-NG")}
                          </div>
                          {c.preferredDate && (
                            <div style={{ color: "var(--color-mid)", fontSize: "0.72rem", marginTop: 2 }}>
                              Preferred: {new Date(c.preferredDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric"})}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "0.875rem", borderTop: "1px solid var(--color-border)" }}>
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem" }} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
                  <span style={{ color: "var(--color-mid)", fontSize: "0.82rem", display: "flex", alignItems: "center" }}>Page {page} of {data.totalPages}</span>
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem" }} disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selectedId && selectedConsult && (
              <div className="card" style={{ borderTop: "3px solid var(--color-gold)", alignSelf: "start" }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: 16 }}>Consultation Details</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {[
                    ["Full Name", selectedConsult.fullName],
                    ["Email", selectedConsult.email],
                    ["Phone", selectedConsult.phone],
                    ["Service Needed", selectedConsult.serviceNeeded ?? "Not specified"],
                    ["Preferred Date", selectedConsult.preferredDate ?? "Not specified"],
                    ["Preferred Time", selectedConsult.preferredTime ?? "Not specified"],
                    ["Submitted", new Date(selectedConsult.createdAt).toLocaleString("en-NG")],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 10 }}>
                      <span style={{ color: "var(--color-light)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", minWidth: 110 }}>{k}</span>
                      <span style={{ color: "var(--color-dark)", fontSize: "0.85rem" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {selectedConsult.message && (
                  <div style={{ background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.875rem", marginBottom: 16 }}>
                    <div style={{ color: "var(--color-light)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Message</div>
                    <p style={{ color: "var(--color-mid)", fontSize: "0.85rem", lineHeight: 1.7, margin: 0 }}>{selectedConsult.message}</p>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Internal Notes</label>
                  <textarea className="form-textarea" style={{ minHeight: 80 }}
                    placeholder="Add internal notes about this consultation..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Update Status</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                    {STATUS_OPTIONS.map((s) => {
                      const sb = statusStyle[s];
                      const isCurrent = selectedConsult.status === s;
                      return (
                        <button key={s}
                          className="btn"
                          disabled={updateStatus.isLoading}
                          onClick={() => updateStatus.mutate({ id: selectedConsult.id, status: s, notes: noteInput })}
                          style={{ fontSize: "0.75rem", padding: "0.5rem",
                            background: isCurrent ? sb.color : "white",
                            color: isCurrent ? "white" : sb.color,
                            border: `1px solid ${sb.color}`,
                            fontWeight: isCurrent ? 700 : 400,
                          }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button className="btn btn-ghost" style={{ width: "100%", fontSize: "0.8rem" }} onClick={() => setSelectedId(null)}>
                  Close Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

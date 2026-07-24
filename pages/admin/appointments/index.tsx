// pages/admin/appointments/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePagination } from "@/hooks/index";

export default function AdminAppointmentsPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination();
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const { data, isLoading } = trpc.appointment.list.useQuery(
    { page, pageSize, status: statusFilter || undefined },
    { enabled: isAuthenticated }
  );
  const statusStyle: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "#fff8e1", color: "#f57f17" }, CONFIRMED: { bg: "#e8f5e9", color: "#2e7d32" },
    COMPLETED: { bg: "#f3e5f5", color: "#6a1b9a" }, CANCELLED: { bg: "#fce4ec", color: "#c62828" },
    RESCHEDULED: { bg: "#e3f2fd", color: "#1565c0" },
  };
  return (
    <>
      <Head><title>Appointments — Admin</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>All Appointments</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} appointments</p>
          </div>
          <div className="card" style={{ marginBottom: 14, padding: "0.875rem 1.25rem" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["", ...["PENDING","CONFIRMED","COMPLETED","CANCELLED","RESCHEDULED"]].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s as string | ""); setPage(1); }} className="btn"
                  style={{ fontSize: "0.75rem", padding: "0.4rem 0.875rem", background: statusFilter === s ? "var(--color-dark)" : "white", color: statusFilter === s ? "var(--color-gold)" : "var(--color-mid)", border: `1px solid ${statusFilter === s ? "var(--color-dark)" : "var(--color-border)"}` }}>
                  {s === "" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Subject</th><th>Client</th><th>Lawyer</th><th>Date & Time</th><th>Duration</th><th>Status</th></tr></thead>
                  <tbody>
                    {data?.appointments?.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No appointments.</td></tr>
                    ) : data?.appointments?.map(a => {
                      const sb = statusStyle[a.status] ?? { bg: "#f5f5f5", color: "#555" };
                      return (
                        <tr key={a.id}>
                          <td style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem" }}>{a.subject}</td>
                          <td style={{ fontSize: "0.85rem" }}>{a.client.user.firstName} {a.client.user.lastName}</td>
                          <td style={{ fontSize: "0.85rem" }}>{a.lawyer.user.firstName} {a.lawyer.user.lastName}</td>
                          <td style={{ fontSize: "0.82rem", color: "var(--color-gold)", fontWeight: 600 }}>
                            {new Date(a.scheduledAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} &nbsp;
                            <span style={{ color: "var(--color-mid)", fontWeight: 400 }}>{new Date(a.scheduledAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</span>
                          </td>
                          <td style={{ color: "var(--color-mid)", fontSize: "0.82rem" }}>{a.duration} min</td>
                          <td><span style={{ background: sb.bg, color: sb.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{a.status}</span></td>
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

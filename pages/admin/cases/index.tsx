// pages/admin/cases/index.tsx — Admin full case management
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useDebounce, usePagination } from "@/hooks/index";

export default function AdminCasesPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | "">("");
  const dSearch = useDebounce(search, 350);
  const { data, isLoading } = trpc.case.getAll.useQuery({ page, pageSize, search: dSearch || undefined, status: status || undefined, sortBy: "updatedAt", sortOrder: "desc" }, { enabled: isAuthenticated });
  const statusColors: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: "#e8f5e9", color: "#2e7d32" }, PENDING: { bg: "#fff8e1", color: "#f57f17" },
    HEARING_SCHEDULED: { bg: "#e3f2fd", color: "#1565c0" }, CLOSED: { bg: "#f5f5f5", color: "#757575" },
    JUDGMENT_DELIVERED: { bg: "#f3e5f5", color: "#6a1b9a" }, ARCHIVED: { bg: "#f5f5f5", color: "#9e9e9e" },
  };
  return (
    <>
      <Head><title>Cases — Admin</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <div>
              <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>All Cases</h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} total cases</p>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16, padding: "0.875rem 1.25rem" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="Search cases..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              <select className="form-select" style={{ minWidth: 160 }} value={status} onChange={e => { setStatus(e.target.value as string | ""); setPage(1); }}>
                <option value="">All Statuses</option>
                {["PENDING","ACTIVE","HEARING_SCHEDULED","JUDGMENT_DELIVERED","CLOSED","ARCHIVED"].map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              {(search || status) && <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} onClick={() => { setSearch(""); setStatus(""); }}>Clear</button>}
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Case</th><th>Client</th><th>Practice Area</th><th>Lawyers</th><th>Status</th><th>Priority</th><th>Next Hearing</th><th>Action</th></tr></thead>
                  <tbody>
                    {data?.cases?.length === 0 ? <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No cases found.</td></tr>
                      : data?.cases?.map(c => {
                        const sb = statusColors[c.status] ?? { bg: "#f5f5f5", color: "#555" };
                        return (
                          <tr key={c.id}>
                            <td><div style={{ color: "var(--color-gold)", fontSize: "0.72rem", fontWeight: 700 }}>{c.caseNumber}</div><div style={{ fontFamily: "var(--font-serif)", fontSize: "0.88rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div></td>
                            <td style={{ fontSize: "0.85rem" }}>{c.client.user.firstName} {c.client.user.lastName}</td>
                            <td style={{ fontSize: "0.82rem", color: "var(--color-mid)" }}>{c.practiceArea}</td>
                            <td style={{ fontSize: "0.8rem" }}>{c.lawyers?.length ?? 0} assigned</td>
                            <td><span style={{ background: sb.bg, color: sb.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{c.status.replace(/_/g, " ")}</span></td>
                            <td style={{ fontSize: "0.75rem", fontWeight: 700, color: c.priority === "URGENT" ? "#ef5350" : c.priority === "HIGH" ? "#ff9800" : "var(--color-mid)" }}>{c.priority}</td>
                            <td style={{ fontSize: "0.78rem", color: "var(--color-light)" }}>{c.hearings?.[0] ? new Date(c.hearings[0].hearingDate).toLocaleDateString("en-NG") : "—"}</td>
                            <td><Link href={`/lawyer/cases/${c.id}`}><button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem" }}>View</button></Link></td>
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

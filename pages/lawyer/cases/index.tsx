// pages/lawyer/cases/index.tsx
// ── Lawyer cases list — search, filter by status/priority, paginate

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useDebounce, usePagination } from "@/hooks/index";

export default function LawyerCasesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
  | ""
  | "PENDING"
  | "ACTIVE"
  | "ARCHIVED"
  | "HEARING_SCHEDULED"
  | "JUDGMENT_DELIVERED"
  | "CLOSED"
>("");
const [priorityFilter, setPriorityFilter] = useState<
  "" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
>("");
const [priority, setPriority] = useState<
  | ""
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT"
>("");
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isFetching } = trpc.case.getAll.useQuery({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    sortBy: "updatedAt",
    sortOrder: "desc",
  }, { enabled: isAuthenticated, keepPreviousData: true });

  const statusColors: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: "#e8f5e9", color: "#2e7d32" },
    PENDING: { bg: "#fff8e1", color: "#f57f17" },
    HEARING_SCHEDULED: { bg: "#e3f2fd", color: "#1565c0" },
    CLOSED: { bg: "#f5f5f5", color: "#757575" },
    ARCHIVED: { bg: "#f5f5f5", color: "#9e9e9e" },
    JUDGMENT_DELIVERED: { bg: "#f3e5f5", color: "#6a1b9a" },
  };

  const priorityColors: Record<string, string> = {
    URGENT: "#ef5350", HIGH: "#ff9800", MEDIUM: "#fdd835", LOW: "#66bb6a",
  };

  return (
    <>
      <Head><title>Cases — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", fontFamily: "var(--font-sans)", padding: "2rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem", cursor: "pointer" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Cases</h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>
                {data?.total ?? 0} total cases
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: 20, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input
                className="form-input"
                style={{ flex: 1, minWidth: 220 }}
                placeholder="Search by case number, title, client, court..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              <select
                className="form-select"
                style={{ minWidth: 160 }}
                value={statusFilter}
                onChange={e =>
  setStatusFilter(
    e.target.value as
      | ""
      | "PENDING"
      | "ACTIVE"
      | "ARCHIVED"
      | "HEARING_SCHEDULED"
      | "JUDGMENT_DELIVERED"
      | "CLOSED"
  )
}
              >
                <option value="">All Statuses</option>
                {["PENDING","ACTIVE","HEARING_SCHEDULED","JUDGMENT_DELIVERED","CLOSED","ARCHIVED"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select
                className="form-select"
                style={{ minWidth: 140 }}
                value={priorityFilter}
                onChange={(e) => {
  setPriorityFilter(
    e.target.value as
      | ""
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "URGENT"
  );
  setPage(1);
}}
              >
                <option value="">All Priorities</option>
                {["LOW","MEDIUM","HIGH","URGENT"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {(search || statusFilter || priorityFilter) && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: "0.8rem" }}
                  onClick={() => { setSearch(""); setStatusFilter(""); setPriorityFilter(""); setPage(1); }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Cases Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto" }}></div>
              </div>
            ) : data?.cases?.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <p style={{ color: "var(--color-light)", fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>No cases found.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Client</th>
                      <th>Practice Area</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Next Hearing</th>
                      <th>Docs / Tasks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.cases?.map((c) => {
                      const badge = statusColors[c.status] ?? { bg: "#f5f5f5", color: "#555" };
                      return (
                        <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/lawyer/cases/${c.id}`)}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColors[c.priority] ?? "#ccc", flexShrink: 0 }}></span>
                              <div>
                                <div style={{ color: "var(--color-gold)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em" }}>{c.caseNumber}</div>
                                <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.88rem", color: "var(--color-dark)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.85rem" }}>{c.client.user.firstName} {c.client.user.lastName}</td>
                          <td style={{ fontSize: "0.82rem", color: "var(--color-mid)" }}>{c.practiceArea}</td>
                          <td><span className="badge" style={{ background: badge.bg, color: badge.color, fontSize: "0.65rem" }}>{c.status.replace(/_/g, " ")}</span></td>
                          <td><span style={{ fontSize: "0.72rem", fontWeight: 700, color: priorityColors[c.priority] ?? "#ccc" }}>{c.priority}</span></td>
                          <td style={{ fontSize: "0.8rem", color: "var(--color-light)", whiteSpace: "nowrap" }}>
                            {c.hearings?.[0] ? new Date(c.hearings[0].hearingDate).toLocaleDateString("en-NG") : "—"}
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "var(--color-mid)" }}>
                            📄 {c._count?.documents ?? 0} · ✅ {c._count?.tasks ?? 0}
                          </td>
                          <td>
                            <Link href={`/lawyer/cases/${c.id}`} onClick={(e) => e.stopPropagation()}>
                              <button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "0.35rem 0.875rem" }}>View</button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: "var(--color-light)", padding: "0 4px" }}>...</span>}
                    <button
                      className={`btn ${p === page ? "btn-primary" : "btn-ghost"}`}
                      style={{ fontSize: "0.8rem", minWidth: 36, padding: "0.5rem" }}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

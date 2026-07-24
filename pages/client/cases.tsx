// pages/client/cases.tsx
// ── Client — my cases list with status tracking

import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function ClientCasesPage() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.case.getAll.useQuery(
    { page: 1, pageSize: 50, sortBy: "updatedAt", sortOrder: "desc" },
    { enabled: isAuthenticated }
  );

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:           { bg: "#fff8e1", color: "#f57f17", label: "Pending" },
    ACTIVE:            { bg: "#e8f5e9", color: "#2e7d32", label: "Active" },
    HEARING_SCHEDULED: { bg: "#e3f2fd", color: "#1565c0", label: "Hearing Scheduled" },
    JUDGMENT_DELIVERED:{ bg: "#f3e5f5", color: "#6a1b9a", label: "Judgment Delivered" },
    CLOSED:            { bg: "#f5f5f5", color: "#757575", label: "Closed" },
    ARCHIVED:          { bg: "#f5f5f5", color: "#9e9e9e", label: "Archived" },
  };

  const priorityColor: Record<string, string> = { URGENT: "#ef5350", HIGH: "#ff9800", MEDIUM: "#fdd835", LOW: "#66bb6a" };

  return (
    <>
      <Head><title>My Cases — Client Portal · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/client/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>My Cases</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} cases</p>
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
          ) : data?.cases?.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
              <p style={{ fontFamily: "var(--font-serif)", color: "var(--color-mid)", fontSize: "1.1rem" }}>No cases on file.</p>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem" }}>Contact us to discuss your legal matter.</p>
              <Link href="/client/appointments" style={{ display: "inline-block", marginTop: 16 }}>
                <button className="btn btn-primary">Book Consultation</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {data?.cases?.map((c) => {
                const sb = statusStyle[c.status] ?? { bg: "#f5f5f5", color: "#555", label: c.status };
                const nextHearing = c.hearings?.[0];
                return (
                  <div key={c.id} className="card" style={{ borderLeft: "4px solid var(--color-gold)", transition: "all 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ color: "var(--color-gold)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em" }}>{c.caseNumber}</span>
                          <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "0.62rem" }}>{sb.label}</span>
                          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: priorityColor[c.priority] ?? "#ccc" }} title={`Priority: ${c.priority}`}></span>
                        </div>
                        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", color: "var(--color-dark)", margin: "0 0 8px" }}>{c.title}</h3>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ color: "var(--color-mid)", fontSize: "0.78rem" }}>📂 {c.practiceArea}</span>
                          {c.lawyers?.[0] && (
                            <span style={{ color: "var(--color-mid)", fontSize: "0.78rem" }}>⚖️ {c.lawyers[0].lawyer.user.firstName} {c.lawyers[0].lawyer.user.lastName}</span>
                          )}
                          <span style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>📄 {c._count?.documents ?? 0} docs · ✅ {c._count?.tasks ?? 0} tasks</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {nextHearing ? (
                          <div>
                            <div style={{ color: "var(--color-light)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Next Hearing</div>
                            <div style={{ color: "var(--color-gold)", fontSize: "0.82rem", fontWeight: 600 }}>
                              {new Date(nextHearing.hearingDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                            <div style={{ color: "var(--color-mid)", fontSize: "0.75rem" }}>{nextHearing.court}</div>
                          </div>
                        ) : (
                          <div style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>No hearing scheduled</div>
                        )}
                        <div style={{ color: "var(--color-light)", fontSize: "0.68rem", marginTop: 8 }}>
                          Updated: {new Date(c.createdAt).toLocaleDateString("en-NG")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

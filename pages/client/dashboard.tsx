// pages/client/dashboard.tsx
// ── Client portal dashboard

import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function ClientDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { data: dashboard, isLoading: dashLoading } = trpc.clients.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "CLIENT",
  });
  const { data: cases } = trpc.case.getAll.useQuery(
    { page: 1, pageSize: 5 },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && user?.role !== "CLIENT" && user?.role !== "ADMIN") {
      router.push("/lawyer/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || dashLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  const stats = [
    { label: "Active Cases", value: dashboard?.activeCases ?? 0, icon: "⚖️", color: "#e3f2fd" },
    { label: "Upcoming Hearings", value: dashboard?.upcomingHearings ?? 0, icon: "📅", color: "#fff8e1" },
    { label: "Pending Invoices", value: dashboard?.pendingInvoices ?? 0, icon: "💰", color: "#fce4ec" },
    { label: "Unread Messages", value: dashboard?.unreadMessages ?? 0, icon: "✉️", color: "#e8f5e9" },
  ];

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "#2e7d32", PENDING: "#f57f17",
      HEARING_SCHEDULED: "#1565c0", CLOSED: "#555",
    };
    return map[status] ?? "#555";
  };
  const statusBg = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "#e8f5e9", PENDING: "#fff8e1",
      HEARING_SCHEDULED: "#e3f2fd", CLOSED: "#f5f5f5",
    };
    return map[status] ?? "#f5f5f5";
  };

  return (
    <>
      <Head><title>Client Dashboard — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", fontFamily: "var(--font-sans)" }}>

        {/* ── Sidebar Navigation */}
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <aside style={{ width: 240, background: "var(--color-dark)", padding: "1.5rem 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "0 1.5rem 1.5rem", borderBottom: "1px solid #2d2d2d" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "transparent", border: "2px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-serif)", fontWeight: "bold", fontSize: 14 }}>DDO</span>
              </div>
              <p style={{ color: "var(--color-gold)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>Client Portal</p>
            </div>

            <nav style={{ flex: 1, padding: "1rem 0" }}>
              {[
                { label: "Dashboard", href: "/client/dashboard", icon: "🏠" },
                { label: "My Cases", href: "/client/cases", icon: "⚖️" },
                { label: "Appointments", href: "/client/appointments", icon: "📅" },
                { label: "Documents", href: "/client/documents", icon: "📁" },
                { label: "Invoices", href: "/client/invoices", icon: "💰" },
                { label: "Messages", href: "/client/messages", icon: "✉️" },
                { label: "My Profile", href: "/client/profile", icon: "👤" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "0.75rem 1.5rem", cursor: "pointer",
                      background: router.pathname === item.href ? "rgba(201,168,76,0.1)" : "transparent",
                      borderLeft: router.pathname === item.href ? "3px solid var(--color-gold)" : "3px solid transparent",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { if (router.pathname !== item.href) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (router.pathname !== item.href) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>{item.icon}</span>
                    <span style={{ color: router.pathname === item.href ? "var(--color-gold)" : "#888", fontSize: "0.875rem" }}>{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>

            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #2d2d2d" }}>
              <Link href="/">
                <p style={{ color: "#666", fontSize: "0.75rem", marginBottom: 8, cursor: "pointer" }}>← Back to Website</p>
              </Link>
              <button
                onClick={() => logout()}
                style={{ width: "100%", padding: "0.625rem", background: "transparent", border: "1px solid #333", borderRadius: "var(--radius-sm)", color: "#888", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c62828"; e.currentTarget.style.color = "#ef5350"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}
              >
                Sign Out
              </button>
            </div>
          </aside>

          {/* ── Main Content */}
          <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: 6, display: "inline-block" }}>Client Portal</span>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: 0 }}>
                  Good day, {user?.firstName} {user?.lastName}
                </h1>
              </div>
              <Link href="/client/appointments">
                <button className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                  + Book Appointment
                </button>
              </Link>
            </div>

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: "1.75rem" }}>
              {stats.map((s) => (
                <div key={s.label} className="card" style={{ textAlign: "center", borderTop: `3px solid var(--color-gold)` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-dark)", fontWeight: "bold" }}>{s.value}</div>
                  <div style={{ color: "var(--color-light)", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              {/* Active Cases */}
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", margin: 0 }}>Active Cases</h3>
                  <Link href="/client/cases"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem", cursor: "pointer" }}>View All →</span></Link>
                </div>
                {cases?.cases?.length === 0 ? (
                  <p style={{ color: "var(--color-light)", textAlign: "center", padding: "2rem 0" }}>No cases found.</p>
                ) : (
                  cases?.cases?.map((c) => (
                    <div key={c.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "var(--color-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{c.caseNumber}</div>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", color: "var(--color-dark)", marginTop: 2 }}>{c.title}</div>
                        <div style={{ color: "var(--color-light)", fontSize: "0.75rem", marginTop: 2 }}>{c.practiceArea}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="badge" style={{ background: statusBg(c.status), color: statusColor(c.status) }}>
                          {c.status.replace(/_/g, " ")}
                        </span>
                        {c.hearings?.[0] && (
                          <div style={{ color: "var(--color-light)", fontSize: "0.7rem", marginTop: 4 }}>
                            Next: {new Date(c.hearings[0].hearingDate).toLocaleDateString("en-NG")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming Appointments */}
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", margin: 0 }}>Upcoming</h3>
                  <Link href="/client/appointments"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem", cursor: "pointer" }}>View All →</span></Link>
                </div>
                {dashboard?.upcomingAppointments?.length === 0 ? (
                  <p style={{ color: "var(--color-light)", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>No upcoming appointments.</p>
                ) : (
                  dashboard?.upcomingAppointments?.map((a) => (
                    <div key={a.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "12px 0" }}>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.875rem", color: "var(--color-dark)" }}>{a.subject}</div>
                      <div style={{ color: "var(--color-gold)", fontSize: "0.75rem", marginTop: 3, fontWeight: 600 }}>
                        {new Date(a.scheduledAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                      <div style={{ color: "var(--color-light)", fontSize: "0.7rem" }}>
                        with {a.lawyer.user.firstName} {a.lawyer.user.lastName}
                      </div>
                    </div>
                  ))
                )}
                <Link href="/client/appointments">
                  <button className="btn btn-outline" style={{ width: "100%", marginTop: 16, fontSize: "0.75rem" }}>
                    Book Appointment
                  </button>
                </Link>
              </div>
            </div>

            {/* Recent Documents */}
            {dashboard?.recentDocs && dashboard.recentDocs.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", margin: 0 }}>Recent Documents</h3>
                  <Link href="/client/documents"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem", cursor: "pointer" }}>View All →</span></Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {dashboard.recentDocs.map((doc) => (
                    <div key={doc.id} style={{ background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.875rem", cursor: "pointer" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-dark)", fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-light)" }}>
                        {doc.type} · {new Date(doc.createdAt).toLocaleDateString("en-NG")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

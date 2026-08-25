// pages/admin/dashboard.tsx
// ── Admin portal — platform-wide statistics and management hub

import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ADMIN_LEVEL_ROLES, type UserRoleType } from "@/types/index";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.admin.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated && !!user && ADMIN_LEVEL_ROLES.includes(user.role as UserRoleType),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && user && !ADMIN_LEVEL_ROLES.includes(user.role as UserRoleType)) router.push("/login");
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || statsLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-cream)" }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Users", href: "/admin/users", icon: "👥" },
    { label: "Lawyers", href: "/admin/lawyers", icon: "⚖️" },
    { label: "Staff", href: "/admin/staff/new", icon: "🧑‍💼" },
    { label: "Clients", href: "/admin/clients", icon: "👤" },
    { label: "Cases", href: "/admin/cases", icon: "📋" },
    { label: "Appointments", href: "/admin/appointments", icon: "📅" },
    { label: "Documents", href: "/admin/documents", icon: "📁" },
    { label: "Invoices", href: "/admin/invoices", icon: "💰" },
    { label: "Publications", href: "/admin/publications", icon: "📝" },
    { label: "Consultations", href: "/admin/consultations", icon: "📬" },
    { label: "Newsletter", href: "/admin/newsletter", icon: "📧" },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: "🔍" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  const kpiCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: "👥", color: "#1565c0", change: "+12% this month" },
    { label: "Active Lawyers", value: stats?.lawyers ?? 0, icon: "⚖️", color: "var(--color-gold-dark)" },
    { label: "Total Clients", value: stats?.clients ?? 0, icon: "👤", color: "#2e7d32" },
    { label: "Total Cases", value: stats?.totalCases ?? 0, icon: "📋", color: "#6a1b9a" },
    { label: "Active Cases", value: stats?.activeCases ?? 0, icon: "🔴", color: "#ef5350" },
    { label: "Documents", value: stats?.documents ?? 0, icon: "📁", color: "#00695c" },
    { label: "Upcoming Appts", value: stats?.upcomingAppointments ?? 0, icon: "📅", color: "#e65100" },
    { label: "New Consultations", value: stats?.pendingConsultations ?? 0, icon: "📬", color: "#c62828" },
  ];

  const actionColor = (action: string) => {
    const map: Record<string, string> = {
      LOGIN: "#1565c0", LOGOUT: "#757575", CREATE: "#2e7d32",
      UPDATE: "#e65100", DELETE: "#c62828", FILE_UPLOAD: "#6a1b9a",
      FILE_DOWNLOAD: "#00695c",
    };
    return map[action] ?? "#555";
  };

  return (
    <>
      <Head><title>Admin Dashboard — D.D. Onietan & Co.</title></Head>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-cream)", fontFamily: "var(--font-sans)" }}>

        {/* ── Sidebar */}
        <aside style={{ width: 240, background: "var(--color-dark)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #2d2d2d" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-serif)", fontWeight: "bold", fontSize: 11 }}>DDO</span>
              </div>
              <div>
                <p style={{ color: "var(--color-gold)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Admin Portal</p>
                <p style={{ color: "#666", fontSize: "0.7rem", margin: 0 }}>System Administrator</p>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "0.5rem 0" }}>
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "0.65rem 1.5rem", cursor: "pointer",
                    background: active ? "rgba(201,168,76,0.1)" : "transparent",
                    borderLeft: active ? "3px solid var(--color-gold)" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>{item.icon}</span>
                    <span style={{ color: active ? "var(--color-gold)" : "#888", fontSize: "0.82rem" }}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #2d2d2d" }}>
            <button onClick={() => logout()}
              style={{ width: "100%", padding: "0.55rem", background: "transparent", border: "1px solid #333", borderRadius: "var(--radius-sm)", color: "#888", fontSize: "0.78rem", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c62828"; e.currentTarget.style.color = "#ef5350"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}
            >Sign Out</button>
          </div>
        </aside>

        {/* ── Main Content */}
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <span className="badge badge-gold" style={{ marginBottom: 6, display: "inline-block" }}>Admin</span>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: 0 }}>Platform Dashboard</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", marginTop: 4 }}>
              {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* KPI Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: "1.75rem" }}>
            {kpiCards.map((k) => (
              <div key={k.label} className="card" style={{ padding: "1.25rem", borderTop: `3px solid ${k.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{k.icon}</span>
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-dark)", fontWeight: "bold", lineHeight: 1 }}>{k.value}</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>{k.label}</div>
                {k.change && <div style={{ color: "#2e7d32", fontSize: "0.7rem", marginTop: 4 }}>↑ {k.change}</div>}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: "0 0 14px" }}>Quick Actions</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Create Lawyer Account", href: "/admin/lawyers/new", icon: "⚖️" },
                { label: "Create Staff Account", href: "/admin/staff/new", icon: "🧑‍💼" },
                { label: "Approve Pending Clients", href: "/admin/clients", icon: "👤" },
                { label: "View Consultations", href: "/admin/consultations", icon: "📬" },
                { label: "Manage Cases", href: "/admin/cases", icon: "📋" },
                { label: "View Audit Logs", href: "/admin/audit-logs", icon: "🔍" },
                { label: "Send Newsletter", href: "/admin/newsletter", icon: "📧" },
                { label: "Manage Publications", href: "/admin/publications", icon: "📝" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <button className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "0.55rem 1rem" }}>
                    {a.icon} {a.label}
                  </button>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
            {/* Recent Audit Logs */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: 0 }}>Recent Activity</h3>
                <Link href="/admin/audit-logs"><span style={{ color: "var(--color-gold)", fontSize: "0.78rem", cursor: "pointer" }}>View All →</span></Link>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentAuditLogs?.slice(0, 10).map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 500 }}>
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                        </td>
                        <td>
                          <span className="badge" style={{ background: `${actionColor(log.action)}18`, color: actionColor(log.action), fontSize: "0.65rem" }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ color: "var(--color-mid)" }}>{log.resource}</td>
                        <td style={{ color: "var(--color-light)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                          {new Date(log.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Consultations */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: 0 }}>
                  New Consultations
                  {stats?.pendingConsultations ? (
                    <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: "0.65rem" }}>
                      {stats.pendingConsultations}
                    </span>
                  ) : null}
                </h3>
                <Link href="/admin/consultations"><span style={{ color: "var(--color-gold)", fontSize: "0.78rem", cursor: "pointer" }}>View All →</span></Link>
              </div>
              <p style={{ color: "var(--color-light)", fontSize: "0.82rem", marginBottom: 16 }}>
                Pending consultation requests from the website need to be reviewed and assigned.
              </p>
              <Link href="/admin/consultations">
                <button className="btn btn-primary" style={{ width: "100%", fontSize: "0.8rem" }}>
                  Review Consultations ({stats?.pendingConsultations ?? 0} new)
                </button>
              </Link>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", marginBottom: 12 }}>Newsletter</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--color-dark)" }}>{stats?.newSubscribers ?? 0}</div>
                    <div style={{ color: "var(--color-light)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Active Subscribers</div>
                  </div>
                  <Link href="/admin/newsletter">
                    <button className="btn btn-outline" style={{ fontSize: "0.75rem" }}>Manage</button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

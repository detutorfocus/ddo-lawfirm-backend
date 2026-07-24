// pages/lawyer/dashboard.tsx
// ── Lawyer portal dashboard — cases, hearings, tasks, calendar

import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function LawyerDashboard() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const { data: caseStats } = trpc.case.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myStats } = trpc.lawyer.getLawyerStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "LAWYER",
  });
  const { data: casesData } = trpc.case.getAll.useQuery(
    { page: 1, pageSize: 6, sortBy: "updatedAt", sortOrder: "desc" },
    { enabled: isAuthenticated }
  );
  const { data: tasksData } = trpc.task.list.useQuery(
    { assignedToMe: true, status: "IN_PROGRESS" },
    { enabled: isAuthenticated }
  );
  const { data: todoTasks } = trpc.task.list.useQuery(
    { assignedToMe: true, status: "TODO" },
    { enabled: isAuthenticated }
  );

  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });
  const utils = trpc.useContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && user?.role === "CLIENT") {
      router.push("/client/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-cream)" }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/lawyer/dashboard", icon: "🏠" },
    { label: "Cases", href: "/lawyer/cases", icon: "⚖️" },
    { label: "Calendar", href: "/lawyer/calendar", icon: "📅" },
    { label: "Documents", href: "/lawyer/documents", icon: "📁" },
    { label: "Tasks", href: "/lawyer/tasks", icon: "✅" },
    { label: "Messages", href: "/lawyer/messages", icon: "✉️" },
    { label: "Appointments", href: "/lawyer/appointments", icon: "🤝" },
    { label: "Publications", href: "/lawyer/publications", icon: "📝" },
    { label: "Clients", href: "/lawyer/clients", icon: "👥" },
    { label: "My Profile", href: "/lawyer/profile", icon: "👤" },
  ];

  const statsCards = [
    { label: "Assigned Cases", value: myStats?.totalCases ?? 0, icon: "⚖️", color: "var(--color-gold)" },
    { label: "Active Cases", value: myStats?.activeCases ?? 0, icon: "🔴", color: "#ef5350" },
    { label: "Upcoming Hearings", value: caseStats?.upcomingHearings?.length ?? 0, icon: "📅", color: "#1565c0" },
    { label: "Pending Tasks", value: myStats?.pendingTasks ?? 0, icon: "✅", color: "#2e7d32" },
    { label: "Publications", value: myStats?.publications ?? 0, icon: "📝", color: "#6a1b9a" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      ACTIVE: { bg: "#e8f5e9", color: "#2e7d32" },
      PENDING: { bg: "#fff8e1", color: "#f57f17" },
      HEARING_SCHEDULED: { bg: "#e3f2fd", color: "#1565c0" },
      CLOSED: { bg: "#f5f5f5", color: "#757575" },
      ARCHIVED: { bg: "#f5f5f5", color: "#9e9e9e" },
      JUDGMENT_DELIVERED: { bg: "#f3e5f5", color: "#6a1b9a" },
    };
    return map[status] ?? { bg: "#f5f5f5", color: "#757575" };
  };

  const priorityDot = (priority: string) => {
    const map: Record<string, string> = {
      URGENT: "#ef5350", HIGH: "#ff9800", MEDIUM: "#fdd835", LOW: "#66bb6a",
    };
    return map[priority] ?? "#ccc";
  };

  return (
    <>
      <Head><title>Lawyer Dashboard — D.D. Onietan & Co.</title></Head>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-cream)", fontFamily: "var(--font-sans)" }}>

        {/* ── Sidebar */}
        <aside style={{ width: 240, background: "var(--color-dark)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid #2d2d2d" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-serif)", fontWeight: "bold", fontSize: 14 }}>DDO</span>
            </div>
            <p style={{ color: "var(--color-gold)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>Lawyer Portal</p>
            <p style={{ color: "#666", fontSize: "0.75rem", marginTop: 4 }}>{user?.firstName} {user?.lastName}</p>
          </div>

          <nav style={{ flex: 1, padding: "0.75rem 0" }}>
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "0.7rem 1.5rem", cursor: "pointer",
                    background: active ? "rgba(201,168,76,0.1)" : "transparent",
                    borderLeft: active ? "3px solid var(--color-gold)" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>{item.icon}</span>
                    <span style={{ color: active ? "var(--color-gold)" : "#888", fontSize: "0.85rem" }}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #2d2d2d" }}>
            <Link href="/"><p style={{ color: "#555", fontSize: "0.75rem", marginBottom: 8, cursor: "pointer" }}>← Main Website</p></Link>
            <button onClick={() => logout()}
              style={{ width: "100%", padding: "0.6rem", background: "transparent", border: "1px solid #333", borderRadius: "var(--radius-sm)", color: "#888", fontSize: "0.8rem", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c62828"; e.currentTarget.style.color = "#ef5350"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}
            >Sign Out</button>
          </div>
        </aside>

        {/* ── Main Content */}
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: 6, display: "inline-block" }}>Lawyer Portal</span>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: 0 }}>
                Welcome, {user?.firstName} {user?.lastName}
              </h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", marginTop: 4 }}>
                {new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/lawyer/cases"><button className="btn btn-outline" style={{ fontSize: "0.8rem" }}>+ New Case</button></Link>
              <Link href="/lawyer/tasks"><button className="btn btn-primary" style={{ fontSize: "0.8rem" }}>+ New Task</button></Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: "1.75rem" }}>
            {statsCards.map((s) => (
              <div key={s.label} className="card" style={{ textAlign: "center", borderTop: `3px solid ${s.color}`, padding: "1.25rem" }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", color: "var(--color-dark)", fontWeight: "bold", margin: "4px 0" }}>{s.value}</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Cases */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", margin: 0 }}>Active Case Load</h3>
                <Link href="/lawyer/cases"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem", cursor: "pointer" }}>View All →</span></Link>
              </div>
              {casesData?.cases?.map((c) => {
                const badge = statusBadge(c.status);
                return (
                  <Link key={c.id} href={`/lawyer/cases/${c.id}`}>
                    <div style={{ borderBottom: "1px solid var(--color-border)", padding: "12px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-cream)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ flex: 1, paddingRight: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: priorityDot(c.priority), flexShrink: 0 }}></span>
                          <span style={{ color: "var(--color-gold)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{c.caseNumber}</span>
                        </div>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", color: "var(--color-dark)" }}>{c.title}</div>
                        <div style={{ color: "var(--color-light)", fontSize: "0.7rem", marginTop: 2 }}>
                          {c.client.user.firstName} {c.client.user.lastName} · {c.practiceArea}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span className="badge" style={{ background: badge.bg, color: badge.color, fontSize: "0.65rem" }}>
                          {c.status.replace(/_/g, " ")}
                        </span>
                        {c.hearings?.[0] && (
                          <div style={{ color: "var(--color-light)", fontSize: "0.65rem", marginTop: 4 }}>
                            {new Date(c.hearings[0].hearingDate).toLocaleDateString("en-NG")}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Tasks + Hearings */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Tasks */}
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>Today's Tasks</h3>
                  <Link href="/lawyer/tasks"><span style={{ color: "var(--color-gold)", fontSize: "0.75rem" }}>View All →</span></Link>
                </div>
                {[...(tasksData ?? []), ...(todoTasks ?? [])].slice(0, 6).map((task) => (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div
                      style={{ width: 17, height: 17, border: `2px solid ${task.status === "COMPLETED" ? "var(--color-gold)" : "var(--color-border)"}`, borderRadius: 3, flexShrink: 0, cursor: "pointer", background: task.status === "COMPLETED" ? "var(--color-gold)" : "transparent", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => updateTask.mutate({ id: task.id, status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" })}
                    >
                      {task.status === "COMPLETED" && <span style={{ color: "white", fontSize: 11 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.82rem", color: task.status === "COMPLETED" ? "var(--color-light)" : "var(--color-dark)", textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>{task.title}</div>
                      {task.dueDate && (
                        <div style={{ fontSize: "0.7rem", color: new Date(task.dueDate) < new Date() ? "#ef5350" : "var(--color-light)", marginTop: 2 }}>
                          Due: {new Date(task.dueDate).toLocaleDateString("en-NG")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Hearings */}
              <div className="card">
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: "0 0 14px" }}>Upcoming Hearings</h3>
                {caseStats?.upcomingHearings?.length === 0 ? (
                  <p style={{ color: "var(--color-light)", fontSize: "0.82rem" }}>No upcoming hearings.</p>
                ) : (
                  caseStats?.upcomingHearings?.slice(0, 4).map((h) => (
                    <div key={h.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "10px 0" }}>
                      <div style={{ color: "var(--color-gold)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em" }}>
                        {new Date(h.hearingDate).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.85rem", color: "var(--color-dark)", marginTop: 2 }}>{h.case.title}</div>
                      <div style={{ color: "var(--color-light)", fontSize: "0.7rem" }}>{h.case.caseNumber}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

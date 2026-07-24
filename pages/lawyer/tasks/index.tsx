// pages/lawyer/tasks/index.tsx
// ── Task management for lawyers

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { QueryState } from "@/components/QueryState";

const priorityColor: Record<string, string> = { URGENT: "#ef5350", HIGH: "#ff9800", MEDIUM: "#fdd835", LOW: "#66bb6a" };
const statusStyle: Record<string, { bg: string; color: string }> = {
  TODO:        { bg: "#f5f5f5", color: "#757575" },
  IN_PROGRESS: { bg: "#e3f2fd", color: "#1565c0" },
  COMPLETED:   { bg: "#e8f5e9", color: "#2e7d32" },
  OVERDUE:     { bg: "#fce4ec", color: "#c62828" },
};

export default function LawyerTasksPage() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useContext();
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const { data: tasks, isLoading, isError, error } = trpc.task.list.useQuery(
    { assignedToMe: true, status: statusFilter || undefined },
    { enabled: isAuthenticated, retry: 1 }
  );

  const update = trpc.task.update.useMutation({
    onSuccess: () => { utils.task.list.invalidate(); showToast("Task updated!"); },
  });

  const del = trpc.task.delete.useMutation({
    onSuccess: () => { utils.task.list.invalidate(); showToast("Task deleted."); },
  });

  const grouped = {
    URGENT: tasks?.filter(t => t.priority === "URGENT" && t.status !== "COMPLETED") ?? [],
    HIGH:   tasks?.filter(t => t.priority === "HIGH" && t.status !== "COMPLETED") ?? [],
    OTHER:  tasks?.filter(t => !["URGENT","HIGH"].includes(t.priority) && t.status !== "COMPLETED") ?? [],
    DONE:   tasks?.filter(t => t.status === "COMPLETED") ?? [],
  };

  return (
    <>
      <Head><title>Tasks — Lawyer Portal · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--color-dark)", color: "white", padding: "0.875rem 1.25rem", borderRadius: "var(--radius-md)", fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid var(--color-gold)" }}>
          {toast}
        </div>
      )}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>My Tasks</h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{tasks?.length ?? 0} tasks assigned</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["", ...["TODO","IN_PROGRESS","COMPLETED","OVERDUE"]] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s as string | "")}
                  className="btn"
                  style={{ fontSize: "0.75rem", padding: "0.4rem 0.875rem",
                    background: statusFilter === s ? "var(--color-dark)" : "white",
                    color: statusFilter === s ? "var(--color-gold)" : "var(--color-mid)",
                    border: `1px solid ${statusFilter === s ? "var(--color-dark)" : "var(--color-border)"}`,
                  }}>
                  {s === "" ? "All" : s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <QueryState isLoading={isLoading} isError={isError} error={error} isEmpty={!tasks || tasks.length === 0} emptyIcon="✅" emptyMessage="No tasks assigned.">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { key: "URGENT", label: "🔴 Urgent", items: grouped.URGENT },
                { key: "HIGH", label: "🟠 High Priority", items: grouped.HIGH },
                { key: "OTHER", label: "📋 Other Tasks", items: grouped.OTHER },
                { key: "DONE", label: "✅ Completed", items: grouped.DONE },
              ].filter(g => g.items.length > 0).map(group => (
                <div key={group.key}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", color: "var(--color-mid)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {group.label} ({group.items.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {group.items.map((task) => {
                      const sb = statusStyle[task.status] ?? { bg: "#f5f5f5", color: "#555" };
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";
                      return (
                        <div key={task.id} className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: 12, opacity: task.status === "COMPLETED" ? 0.6 : 1 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${task.status === "COMPLETED" ? "var(--color-gold)" : priorityColor[task.priority] ?? "var(--color-border)"}`, background: task.status === "COMPLETED" ? "var(--color-gold)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}
                            onClick={() => update.mutate({ id: task.id, status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" })}>
                            {task.status === "COMPLETED" && <span style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                              <div>
                                <span style={{ fontSize: "0.9rem", color: "var(--color-dark)", fontWeight: 500, textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>{task.title}</span>
                                {task.description && <p style={{ color: "var(--color-light)", fontSize: "0.78rem", margin: "4px 0 0", lineHeight: 1.5 }}>{task.description}</p>}
                              </div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                                <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "0.6rem" }}>{task.status.replace(/_/g, " ")}</span>
                                {task.dueDate && (
                                  <span style={{ fontSize: "0.72rem", color: isOverdue ? "#c62828" : "var(--color-light)", fontWeight: isOverdue ? 700 : 400 }}>
                                    {isOverdue ? "⚠️ Overdue · " : "Due: "}
                                    {new Date(task.dueDate).toLocaleDateString("en-NG")}
                                  </span>
                                )}
                                {task.case && <span style={{ color: "var(--color-gold)", fontSize: "0.7rem" }}>{task.case.caseNumber}</span>}
                                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: "0.75rem", padding: "2px 4px" }}
                                  onClick={() => { if (confirm("Delete this task?")) del.mutate({ id: task.id }); }}>✕</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </QueryState>
        </div>
      </div>
    </>
  );
}

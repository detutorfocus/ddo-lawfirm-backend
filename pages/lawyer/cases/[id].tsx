// pages/lawyer/cases/[id].tsx
// ── Full case detail — hearings, docs, tasks, updates, timeline

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

type Tab = "overview" | "hearings" | "documents" | "tasks" | "updates" | "timeline";

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [updateForm, setUpdateForm] = useState({ title: "", content: "", isVisibleToClient: true });
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const utils = trpc.useContext();
  const { data: caseData, isLoading } = trpc.case.getById.useQuery({ id }, { enabled: !!id && isAuthenticated });
  const addUpdate = trpc.case.addUpdate.useMutation({ onSuccess: () => { utils.case.getById.invalidate({ id }); setUpdateForm({ title: "", content: "", isVisibleToClient: true }); setShowUpdateForm(false); } });
  const updateCase = trpc.case.update.useMutation({ onSuccess: () => utils.case.getById.invalidate({ id }) });

  if (isLoading || !caseData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-cream)" }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: "#e8f5e9", color: "#2e7d32" },
    PENDING: { bg: "#fff8e1", color: "#f57f17" },
    HEARING_SCHEDULED: { bg: "#e3f2fd", color: "#1565c0" },
    CLOSED: { bg: "#f5f5f5", color: "#757575" },
    JUDGMENT_DELIVERED: { bg: "#f3e5f5", color: "#6a1b9a" },
    ARCHIVED: { bg: "#f5f5f5", color: "#9e9e9e" },
  };

  const badge = statusColors[caseData.status] ?? { bg: "#f5f5f5", color: "#555" };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "hearings", label: "Hearings", count: caseData.hearings?.length },
    { key: "documents", label: "Documents", count: caseData.documents?.length },
    { key: "tasks", label: "Tasks", count: caseData.tasks?.length },
    { key: "updates", label: "Updates", count: caseData.updates?.length },
    { key: "timeline", label: "Timeline", count: caseData.timeline?.length },
  ];

  return (
    <>
      <Head><title>{caseData.caseNumber} — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", fontFamily: "var(--font-sans)", padding: "2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: "1.25rem" }}>
            <Link href="/lawyer/cases"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem", cursor: "pointer" }}>← Cases</span></Link>
          </div>

          {/* Case Header */}
          <div className="card" style={{ marginBottom: 20, borderLeft: "4px solid var(--color-gold)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--color-gold)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em" }}>{caseData.caseNumber}</span>
                  <span className="badge" style={{ background: badge.bg, color: badge.color, fontSize: "0.65rem" }}>{caseData.status.replace(/_/g, " ")}</span>
                  <span className="badge badge-neutral" style={{ fontSize: "0.65rem" }}>{caseData.priority}</span>
                </div>
                <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: "0 0 8px" }}>{caseData.title}</h1>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <span style={{ color: "var(--color-mid)", fontSize: "0.82rem" }}>
                    👤 {caseData.client.user.firstName} {caseData.client.user.lastName}
                    {caseData.client.companyName && ` (${caseData.client.companyName})`}
                  </span>
                  {caseData.courtName && <span style={{ color: "var(--color-mid)", fontSize: "0.82rem" }}>🏛️ {caseData.courtName}</span>}
                  <span style={{ color: "var(--color-mid)", fontSize: "0.82rem" }}>📂 {caseData.practiceArea}</span>
                  {caseData.filingDate && <span style={{ color: "var(--color-mid)", fontSize: "0.82rem" }}>📅 Filed: {new Date(caseData.filingDate).toLocaleDateString("en-NG")}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  className="form-select"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 0.875rem" }}
                  value={caseData.status}
                  onChange={(e) => updateCase.mutate({ id: caseData.id, status: e.target.value as string })}
                >
                  {["PENDING","ACTIVE","HEARING_SCHEDULED","JUDGMENT_DELIVERED","CLOSED","ARCHIVED"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <button className="btn btn-primary" style={{ fontSize: "0.8rem" }} onClick={() => { setShowUpdateForm(true); setTab("updates"); }}>
                  + Add Update
                </button>
              </div>
            </div>

            {/* Assigned Lawyers */}
            {caseData.lawyers?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                {caseData.lawyers.map((cl) => (
                  <div key={cl.lawyer.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)", padding: "4px 12px" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gold)", fontSize: 10, fontWeight: "bold" }}>
                      {cl.lawyer.user.firstName[0]}{cl.lawyer.user.lastName[0]}
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-dark)" }}>{cl.lawyer.user.firstName} {cl.lawyer.user.lastName}</span>
                    <span style={{ fontSize: "0.68rem", color: "var(--color-light)" }}>· {cl.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, borderBottom: "2px solid var(--color-border)", marginBottom: 20 }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: "0.6rem 1rem", border: "none", background: "transparent", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)", color: tab === t.key ? "var(--color-gold)" : "var(--color-light)", borderBottom: tab === t.key ? "2px solid var(--color-gold)" : "2px solid transparent", marginBottom: -2, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span style={{ background: tab === t.key ? "var(--color-gold)" : "var(--color-border)", color: tab === t.key ? "white" : "var(--color-mid)", borderRadius: "var(--radius-full)", padding: "1px 6px", fontSize: "0.65rem", fontWeight: 700 }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              <div className="card">
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 12 }}>Case Description</h3>
                <p style={{ color: "var(--color-mid)", fontSize: "0.9rem", lineHeight: 1.75 }}>{caseData.description}</p>
                {caseData.notes && (
                  <>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: "20px 0 10px" }}>Internal Notes</h3>
                    <div style={{ background: "var(--color-cream)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.875rem", fontSize: "0.85rem", color: "var(--color-mid)", lineHeight: 1.7 }}>
                      {caseData.notes}
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card" style={{ padding: "1.25rem" }}>
                  <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", marginBottom: 12 }}>Case Details</h4>
                  {[
                    ["Case Number", caseData.caseNumber],
                    ["Practice Area", caseData.practiceArea],
                    ["Court", caseData.courtName ?? "N/A"],
                    ["Location", caseData.courtLocation ?? "N/A"],
                    ["Filing Date", caseData.filingDate ? new Date(caseData.filingDate).toLocaleDateString("en-NG") : "N/A"],
                    ["Retainer", caseData.retainerAmount ? `₦${Number(caseData.retainerAmount).toLocaleString("en-NG")}` : "N/A"],
                    ["Est. Value", caseData.estimatedValue ? `₦${Number(caseData.estimatedValue).toLocaleString("en-NG")}` : "N/A"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--color-light)" }}>{k}</span>
                      <span style={{ color: "var(--color-dark)", fontWeight: 500, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: "1.25rem" }}>
                  <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", marginBottom: 12 }}>Client</h4>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-dark)", fontWeight: 600 }}>{caseData.client.user.firstName} {caseData.client.user.lastName}</div>
                  {caseData.client.companyName && <div style={{ fontSize: "0.78rem", color: "var(--color-mid)" }}>{caseData.client.companyName}</div>}
                  <div style={{ fontSize: "0.78rem", color: "var(--color-gold)", marginTop: 4 }}>{caseData.client.user.email}</div>
                  {caseData.client.user.phone && <div style={{ fontSize: "0.78rem", color: "var(--color-mid)" }}>{caseData.client.user.phone}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Hearings */}
          {tab === "hearings" && (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 16 }}>Hearings Schedule</h3>
              {caseData.hearings?.length === 0 ? (
                <p style={{ color: "var(--color-light)", textAlign: "center", padding: "2rem 0" }}>No hearings recorded.</p>
              ) : (
                caseData.hearings?.map((h) => (
                  <div key={h.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "center" }}>
                    <div>
                      <div style={{ color: "var(--color-gold)", fontSize: "0.78rem", fontWeight: 700 }}>{new Date(h.hearingDate).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-mid)" }}>{new Date(h.hearingDate).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-dark)" }}>{h.court}</div>
                      {h.judge && <div style={{ fontSize: "0.75rem", color: "var(--color-light)" }}>Before: {h.judge}</div>}
                    </div>
                    <div>
                      <span className="badge badge-gold" style={{ fontSize: "0.65rem" }}>{h.hearingType}</span>
                      {h.result && <div style={{ fontSize: "0.75rem", color: "var(--color-mid)", marginTop: 4 }}>Result: {h.result}</div>}
                    </div>
                    <span className="badge" style={{ background: h.isCompleted ? "#e8f5e9" : "#e3f2fd", color: h.isCompleted ? "#2e7d32" : "#1565c0", fontSize: "0.65rem" }}>
                      {h.isCompleted ? "Completed" : "Scheduled"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Documents */}
          {tab === "documents" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>Documents</h3>
                <button className="btn btn-primary" style={{ fontSize: "0.78rem" }}>+ Upload Document</button>
              </div>
              {caseData.documents?.length === 0 ? (
                <p style={{ color: "var(--color-light)", textAlign: "center", padding: "2rem 0" }}>No documents uploaded.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead><tr><th>Title</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Action</th></tr></thead>
                    <tbody>
                      {caseData.documents?.map((doc) => (
                        <tr key={doc.id}>
                          <td style={{ fontWeight: 500 }}>📄 {doc.title}</td>
                          <td><span className="badge badge-neutral" style={{ fontSize: "0.65rem" }}>{doc.type}</span></td>
                          <td style={{ color: "var(--color-light)" }}>{(doc.fileSize / 1024).toFixed(0)} KB</td>
                          <td style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>{new Date(doc.createdAt).toLocaleDateString("en-NG")}</td>
                          <td><button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem" }}>Download</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Tasks */}
          {tab === "tasks" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>Tasks</h3>
                <button className="btn btn-primary" style={{ fontSize: "0.78rem" }}>+ Add Task</button>
              </div>
              {caseData.tasks?.length === 0 ? (
                <p style={{ color: "var(--color-light)", textAlign: "center", padding: "2rem 0" }}>No tasks created.</p>
              ) : (
                caseData.tasks?.map((task) => (
                  <div key={task.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", padding: "12px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 16, height: 16, border: `2px solid ${task.status === "COMPLETED" ? "var(--color-gold)" : "var(--color-border)"}`, borderRadius: 3, background: task.status === "COMPLETED" ? "var(--color-gold)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {task.status === "COMPLETED" && <span style={{ color: "white", fontSize: 10 }}>✓</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.875rem", color: "var(--color-dark)", textDecoration: task.status === "COMPLETED" ? "line-through" : "none" }}>{task.title}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--color-light)" }}>Assigned to: {task.assignedTo?.firstName} {task.assignedTo?.lastName}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {task.dueDate && <span style={{ fontSize: "0.72rem", color: new Date(task.dueDate) < new Date() ? "#ef5350" : "var(--color-light)" }}>Due: {new Date(task.dueDate).toLocaleDateString("en-NG")}</span>}
                      <span className="badge badge-neutral" style={{ fontSize: "0.65rem" }}>{task.priority}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Updates */}
          {tab === "updates" && (
            <div>
              {showUpdateForm && (
                <div className="card" style={{ marginBottom: 16, borderLeft: "3px solid var(--color-gold)" }}>
                  <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 14 }}>Add Case Update</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Update Title</label>
                      <input className="form-input" placeholder="e.g. Hearing Result — 15 Jan 2025" value={updateForm.title} onChange={(e) => setUpdateForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Content</label>
                      <textarea className="form-textarea" style={{ minHeight: 100 }} placeholder="Describe the update..." value={updateForm.content} onChange={(e) => setUpdateForm((p) => ({ ...p, content: e.target.value }))}></textarea>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" id="visibleToClient" checked={updateForm.isVisibleToClient} onChange={(e) => setUpdateForm((p) => ({ ...p, isVisibleToClient: e.target.checked }))} />
                      <label htmlFor="visibleToClient" style={{ fontSize: "0.82rem", color: "var(--color-mid)", cursor: "pointer" }}>Visible to client (will send email notification)</label>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} onClick={() => addUpdate.mutate({ caseId: id, ...updateForm })} disabled={!updateForm.title || !updateForm.content || addUpdate.isLoading}>
                        {addUpdate.isLoading ? "Saving..." : "Save Update"}
                      </button>
                      <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => setShowUpdateForm(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>Case Updates</h3>
                  {!showUpdateForm && <button className="btn btn-primary" style={{ fontSize: "0.78rem" }} onClick={() => setShowUpdateForm(true)}>+ Add Update</button>}
                </div>
                {caseData.updates?.length === 0 ? (
                  <p style={{ color: "var(--color-light)", textAlign: "center", padding: "2rem 0" }}>No updates yet.</p>
                ) : (
                  caseData.updates?.map((u) => (
                    <div key={u.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", color: "var(--color-dark)" }}>{u.title}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {u.isVisibleToClient && <span className="badge badge-success" style={{ fontSize: "0.6rem" }}>Client visible</span>}
                          <span style={{ color: "var(--color-light)", fontSize: "0.72rem" }}>{new Date(u.createdAt).toLocaleDateString("en-NG")}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-mid)", lineHeight: 1.65, margin: 0 }}>{u.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Timeline */}
          {tab === "timeline" && (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 16 }}>Case Timeline</h3>
              {caseData.timeline?.length === 0 ? (
                <p style={{ color: "var(--color-light)", textAlign: "center", padding: "2rem 0" }}>No timeline events recorded.</p>
              ) : (
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "var(--color-border)" }}></div>
                  {caseData.timeline?.map((event) => (
                    <div key={event.id} style={{ position: "relative", marginBottom: 20 }}>
                      <div style={{ position: "absolute", left: -20, top: 4, width: 12, height: 12, borderRadius: "50%", background: "var(--color-gold)", border: "2px solid white" }}></div>
                      <div style={{ color: "var(--color-gold)", fontSize: "0.72rem", fontWeight: 700, marginBottom: 3 }}>
                        {new Date(event.eventDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-dark)", fontWeight: 500 }}>{event.eventType.replace(/_/g, " ")}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-mid)", marginTop: 2 }}>{event.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

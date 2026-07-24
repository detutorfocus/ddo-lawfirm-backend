// pages/client/appointments.tsx
// ── Client appointments — book new, view upcoming, cancel

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AppointmentStatus, PRACTICE_AREAS } from "@/types/index";

export default function ClientAppointmentsPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ lawyerId: "", scheduledAt: "", duration: "60", type: "Consultation", subject: "", notes: "" });
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const { data: appointmentsData } = trpc.appointment.list.useQuery(
    { upcoming: false },
    { enabled: isAuthenticated }
  );
  const { data: lawyersData } = trpc.lawyer.getAll.useQuery({}, { enabled: isAuthenticated });

  const book = trpc.appointment.book.useMutation({
    onSuccess: () => { utils.appointment.list.invalidate(); setShowForm(false); setForm({ lawyerId: "", scheduledAt: "", duration: "60", type: "Consultation", subject: "", notes: "" }); showToast("Appointment request submitted! You will receive a confirmation email."); },
    onError: (err) => showToast(`Error: ${err.message}`),
  });

  const cancel = trpc.appointment.cancel.useMutation({
    onSuccess: () => { utils.appointment.list.invalidate(); showToast("Appointment cancelled."); },
  });

  const statusStyle: Record<string, { bg: string; color: string }> = {
    PENDING:     { bg: "#fff8e1", color: "#f57f17" },
    CONFIRMED:   { bg: "#e8f5e9", color: "#2e7d32" },
    COMPLETED:   { bg: "#f3e5f5", color: "#6a1b9a" },
    CANCELLED:   { bg: "#fce4ec", color: "#c62828" },
    RESCHEDULED: { bg: "#e3f2fd", color: "#1565c0" },
  };

  const upcoming = appointmentsData?.appointments?.filter(a =>
    new Date(a.scheduledAt) >= new Date() && a.status !== "CANCELLED"
  ) ?? [];
  const past = appointmentsData?.appointments?.filter(a =>
    new Date(a.scheduledAt) < new Date() || a.status === "CANCELLED"
  ) ?? [];

  return (
    <>
      <Head><title>Appointments — Client Portal · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--color-dark)", color: "white", padding: "0.875rem 1.25rem", borderRadius: "var(--radius-md)", fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid var(--color-gold)", boxShadow: "var(--shadow-lg)", maxWidth: 340 }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/client/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Appointments</h1>
            </div>
            <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ Book Appointment"}
            </button>
          </div>

          {/* Booking form */}
          {showForm && (
            <div className="card" style={{ marginBottom: 20, borderTop: "3px solid var(--color-gold)" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", marginBottom: 16 }}>Book New Appointment</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                book.mutate({
                  lawyerId: form.lawyerId,
                  scheduledAt: new Date(form.scheduledAt),
                  duration: parseInt(form.duration),
                  type: form.type,
                  subject: form.subject,
                  notes: form.notes || undefined,
                });
              }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Select Lawyer *</label>
                    <select className="form-select" required value={form.lawyerId} onChange={(e) => setForm(p => ({ ...p, lawyerId: e.target.value }))}>
                      <option value="">Choose a lawyer...</option>
                      {lawyersData?.map((l) => (
                        <option key={l.id} value={l.id}>{l.user.firstName} {l.user.lastName} — {l.title} ({l.position})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Appointment Type</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                      {["Consultation", "Case Review", "Document Signing", "Follow-up Meeting", "Court Preparation"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date & Time *</label>
                    <input className="form-input" type="datetime-local" required
                      min={new Date().toISOString().slice(0, 16)}
                      value={form.scheduledAt}
                      onChange={(e) => setForm(p => ({ ...p, scheduledAt: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <select className="form-select" value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))}>
                      {["30", "60", "90", "120"].map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject / Purpose *</label>
                  <input className="form-input" required placeholder="e.g. Initial consultation on property dispute" value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea className="form-textarea" style={{ minHeight: 80 }} placeholder="Any additional information for the lawyer..." value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn-primary" disabled={book.isLoading}>{book.isLoading ? "Booking..." : "Submit Request"}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Upcoming */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", marginBottom: 16 }}>Upcoming Appointments ({upcoming.length})</h3>
            {upcoming.length === 0 ? (
              <p style={{ color: "var(--color-light)", fontSize: "0.88rem", textAlign: "center", padding: "1.5rem 0" }}>No upcoming appointments.</p>
            ) : upcoming.map((a) => {
              const sb = statusStyle[a.status] ?? { bg: "#f5f5f5", color: "#555" };
              return (
                <div key={a.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "0.6rem" }}>{a.status}</span>
                      <span style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", color: "var(--color-dark)" }}>{a.subject}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ color: "var(--color-gold)", fontSize: "0.78rem", fontWeight: 600 }}>
                        📅 {new Date(a.scheduledAt).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span style={{ color: "var(--color-mid)", fontSize: "0.78rem" }}>
                        🕐 {new Date(a.scheduledAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })} ({a.duration} min)
                      </span>
                      <span style={{ color: "var(--color-mid)", fontSize: "0.78rem" }}>
                        👤 {a.lawyer.user.firstName} {a.lawyer.user.lastName}
                      </span>
                    </div>
                    {a.meetingLink && (
                      <a href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-block", marginTop: 6, color: "var(--color-gold)", fontSize: "0.78rem" }}>
                        🔗 Join Meeting Link
                      </a>
                    )}
                  </div>
                  {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                    <button className="btn btn-ghost"
                      style={{ fontSize: "0.72rem", color: "#c62828", borderColor: "#f48fb1" }}
                      onClick={() => { if (confirm("Cancel this appointment?")) cancel.mutate({ id: a.id }); }}>
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", marginBottom: 16 }}>Past Appointments</h3>
              {past.map((a) => {
                const sb = statusStyle[a.status] ?? { bg: "#f5f5f5", color: "#555" };
                return (
                  <div key={a.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "12px 0", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.7 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "0.6rem" }}>{a.status}</span>
                        <span style={{ fontSize: "0.88rem", color: "var(--color-dark)" }}>{a.subject}</span>
                      </div>
                      <div style={{ color: "var(--color-light)", fontSize: "0.75rem", marginTop: 3 }}>
                        {new Date(a.scheduledAt).toLocaleDateString("en-NG")} · {a.lawyer.user.firstName} {a.lawyer.user.lastName}
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

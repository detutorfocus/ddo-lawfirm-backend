// pages/lawyer/appointments/index.tsx
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function LawyerAppointmentsPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useContext();
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };
  const { data, isLoading } = trpc.appointment.list.useQuery({ page: 1, pageSize: 50 }, { enabled: isAuthenticated });
  const confirm = trpc.appointment.confirm.useMutation({ onSuccess: () => { utils.appointment.list.invalidate(); showToast("Appointment confirmed!"); }});
  const cancel = trpc.appointment.cancel.useMutation({ onSuccess: () => { utils.appointment.list.invalidate(); showToast("Cancelled."); }});
  const upcoming = data?.appointments?.filter(a => new Date(a.scheduledAt) >= new Date() && a.status !== "CANCELLED") ?? [];
  const past = data?.appointments?.filter(a => new Date(a.scheduledAt) < new Date() || a.status === "CANCELLED") ?? [];
  const statusStyle: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "#fff8e1", color: "#f57f17" }, CONFIRMED: { bg: "#e8f5e9", color: "#2e7d32" },
    COMPLETED: { bg: "#f3e5f5", color: "#6a1b9a" }, CANCELLED: { bg: "#fce4ec", color: "#c62828" },
    RESCHEDULED: { bg: "#e3f2fd", color: "#1565c0" },
  };
  return (
    <>
      <Head><title>Appointments — Lawyer Portal</title></Head>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1A1A1A", color: "white", padding: "12px 18px", borderRadius: 8, fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid #C9A84C" }}>{toast}</div>}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Appointments</h1>
          </div>
          {isLoading ? <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> : (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 16px" }}>Upcoming ({upcoming.length})</h3>
              {upcoming.length === 0 ? <p style={{ color: "var(--color-light)", textAlign: "center", padding: "1.5rem 0" }}>No upcoming appointments.</p> :
                upcoming.map(a => {
                  const sb = statusStyle[a.status] ?? { bg: "#f5f5f5", color: "#555" };
                  return (
                    <div key={a.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <span style={{ background: sb.bg, color: sb.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{a.status}</span>
                          <span style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", color: "var(--color-dark)" }}>{a.subject}</span>
                        </div>
                        <div style={{ color: "var(--color-gold)", fontSize: "0.8rem", fontWeight: 600 }}>
                          📅 {new Date(a.scheduledAt).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })} · {new Date(a.scheduledAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })} ({a.duration} min)
                        </div>
                        <div style={{ color: "var(--color-mid)", fontSize: "0.8rem", marginTop: 2 }}>
                          👤 {a.client.user.firstName} {a.client.user.lastName}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        {a.status === "PENDING" && (
                          <button className="btn btn-primary" style={{ fontSize: "0.72rem", padding: "0.35rem 0.875rem" }}
                            onClick={() => confirm.mutate({ id: a.id })} disabled={confirm.isLoading}>Confirm</button>
                        )}
                        {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                          <button className="btn btn-ghost" style={{ fontSize: "0.72rem", color: "#c62828" }}
                            onClick={() => { if (window.confirm("Cancel this appointment?")) cancel.mutate({ id: a.id }); }}>Cancel</button>
                        )}
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

// pages/lawyer/calendar/index.tsx
// ── Lawyer calendar — unified hearings + appointments view

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";

export default function LawyerCalendarPage() {
  const { isAuthenticated } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<"month" | "list">("month");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const { data: events } = trpc.appointment.getCalendar.useQuery(
    { from: calStart, to: calEnd },
    { enabled: isAuthenticated }
  );

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const eventsOnDay = (day: Date) =>
    events?.filter((e) => isSameDay(new Date(e.start), day)) ?? [];

  const eventColor = (type: string) =>
    type === "HEARING" ? { bg: "#e3f2fd", color: "#1565c0" } : { bg: "#e8f5e9", color: "#2e7d32" };

  const upcomingEvents = events
    ?.filter((e) => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 10) ?? [];

  return (
    <>
      <Head><title>Calendar — Lawyer Portal · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Calendar</h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["month", "list"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className="btn"
                  style={{ fontSize: "0.8rem", padding: "0.45rem 1rem", background: view === v ? "var(--color-dark)" : "white", color: view === v ? "var(--color-gold)" : "var(--color-mid)", border: `1px solid ${view === v ? "var(--color-dark)" : "var(--color-border)"}` }}>
                  {v === "month" ? "📅 Month" : "📋 List"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
            {view === "month" ? (
              <div className="card" style={{ padding: "1.25rem" }}>
                {/* Month nav */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>← Prev</button>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", margin: 0 }}>{format(currentMonth, "MMMM yyyy")}</h3>
                  <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next →</button>
                </div>

                {/* Weekday headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-light)", textTransform: "uppercase", padding: "4px 0" }}>{d}</div>
                  ))}
                </div>

                {/* Days grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                  {days.map((day, idx) => {
                    const dayEvents = eventsOnDay(day);
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, currentMonth);
                    return (
                      <div key={idx} style={{ minHeight: 80, background: isToday ? "rgba(201,168,76,0.08)" : "var(--color-cream)", border: `1px solid ${isToday ? "var(--color-gold)" : "var(--color-border)"}`, borderRadius: "var(--radius-sm)", padding: "4px 6px", opacity: inMonth ? 1 : 0.35 }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: isToday ? 700 : 400, color: isToday ? "var(--color-gold)" : "var(--color-dark)", marginBottom: 4 }}>{format(day, "d")}</div>
                        {dayEvents.slice(0, 2).map((ev) => {
                          const c = eventColor(ev.type);
                          return (
                            <div key={ev.id} style={{ background: c.bg, color: c.color, borderRadius: 2, padding: "2px 4px", fontSize: "0.62rem", fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ev.title.replace(/^(Hearing|Appointment): /, "")}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && <div style={{ fontSize: "0.6rem", color: "var(--color-light)" }}>+{dayEvents.length - 2} more</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
                  {[{ color: "#1565c0", bg: "#e3f2fd", label: "Court Hearing" }, { color: "#2e7d32", bg: "#e8f5e9", label: "Appointment" }].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: l.bg, border: `1px solid ${l.color}` }}></div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-mid)" }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: "1.25rem" }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", marginBottom: 16 }}>Upcoming Events</h3>
                {upcomingEvents.length === 0 ? (
                  <p style={{ color: "var(--color-light)", textAlign: "center", padding: "2rem" }}>No upcoming events.</p>
                ) : upcomingEvents.map((ev) => {
                  const c = eventColor(ev.type);
                  return (
                    <div key={ev.id} style={{ borderBottom: "1px solid var(--color-border)", padding: "12px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ background: c.bg, color: c.color, padding: "6px 10px", borderRadius: "var(--radius-sm)", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>{ev.type}</div>
                      <div>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", color: "var(--color-dark)" }}>{ev.title}</div>
                        <div style={{ color: "var(--color-gold)", fontSize: "0.75rem", marginTop: 3 }}>
                          {format(new Date(ev.start), "EEEE, d MMM yyyy")} · {format(new Date(ev.start), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Side panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="card" style={{ padding: "1.25rem" }}>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", margin: "0 0 12px" }}>Today</h4>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--color-dark)" }}>{format(new Date(), "d")}</div>
                <div style={{ color: "var(--color-mid)", fontSize: "0.82rem" }}>{format(new Date(), "EEEE, MMMM yyyy")}</div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ color: "var(--color-light)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Today's Events</div>
                  {eventsOnDay(new Date()).length === 0 ? (
                    <p style={{ color: "var(--color-light)", fontSize: "0.82rem" }}>No events today</p>
                  ) : eventsOnDay(new Date()).map((ev) => {
                    const c = eventColor(ev.type);
                    return (
                      <div key={ev.id} style={{ background: c.bg, color: c.color, padding: "6px 8px", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600, marginBottom: 6 }}>
                        {format(new Date(ev.start), "HH:mm")} · {ev.title.replace(/^(Hearing|Appointment): /, "")}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Link href="/lawyer/appointments">
                <button className="btn btn-primary" style={{ width: "100%", fontSize: "0.82rem" }}>+ Add Appointment</button>
              </Link>
              <Link href="/lawyer/cases">
                <button className="btn btn-outline" style={{ width: "100%", fontSize: "0.82rem" }}>View All Cases</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

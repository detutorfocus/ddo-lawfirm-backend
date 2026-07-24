// pages/lawyer/profile/index.tsx
// ── Lawyer profile management — bio, specializations, availability, 2FA

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PRACTICE_AREAS } from "@/types/index";

export default function LawyerProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useContext();
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: stats } = trpc.lawyer.getLawyerStats.useQuery(undefined, { enabled: isAuthenticated });

  const lawyerData = me?.lawyer;

  const [form, setForm] = useState({
    biography: "", specializations: [] as string[],
    isAvailable: true,
  });

  const updateProfile = trpc.lawyer.updateProfile.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); setEditMode(false); showToast("Profile updated!"); },
    onError: (err) => showToast(`Error: ${err.message}`),
  });

  const updateUser = trpc.lawyer.updateUserProfile.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); showToast("Profile updated!"); },
  });

  const startEdit = () => {
    setForm({
      biography: "",
      specializations: lawyerData?.specializations as string[] ?? [],
      isAvailable: true,
    });
    setEditMode(true);
  };

  const toggleSpecialization = (area: string) => {
    setForm(p => ({
      ...p,
      specializations: p.specializations.includes(area)
        ? p.specializations.filter(s => s !== area)
        : [...p.specializations, area],
    }));
  };

  return (
    <>
      <Head><title>My Profile — Lawyer Portal · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--color-dark)", color: "white", padding: "12px 18px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid var(--color-gold)" }}>
          {toast}
        </div>
      )}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>My Profile</h1>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { l: "Total Cases", v: stats?.totalCases ?? 0, i: "⚖️" },
              { l: "Active Cases", v: stats?.activeCases ?? 0, i: "🔴" },
              { l: "Hearings", v: stats?.upcomingHearings ?? 0, i: "📅" },
              { l: "Pending Tasks", v: stats?.pendingTasks ?? 0, i: "✅" },
              { l: "Publications", v: stats?.publications ?? 0, i: "📝" },
            ].map(s => (
              <div key={s.l} className="card" style={{ textAlign: "center", borderTop: "3px solid var(--color-gold)", padding: "1rem" }}>
                <div style={{ fontSize: 20 }}>{s.i}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-dark)" }}>{s.v}</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Profile info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
            {/* Left col — identity */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ textAlign: "center", borderTop: "4px solid var(--color-gold)" }}>
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 28, fontWeight: "bold", color: "var(--color-gold)", fontFamily: "var(--font-serif)", border: "3px solid rgba(201,168,76,0.2)" }}>
                  {me?.firstName?.[0]}{me?.lastName?.[0]}
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", margin: "0 0 4px" }}>{me?.firstName} {me?.lastName}</h3>
                <div style={{ color: "var(--color-gold)", fontSize: "0.85rem", marginBottom: 4 }}>
                  {lawyerData?.title} · {lawyerData?.position}
                </div>
                <div style={{ color: "var(--color-light)", fontSize: "0.78rem", marginBottom: 12 }}>{me?.email}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                  <span className={`badge ${lawyerData ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "0.6rem" }}>
                    {lawyerData ? "Available" : "Unavailable"}
                  </span>
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)", color: "var(--color-light)", fontSize: "0.72rem" }}>
                  Bar No: {lawyerData?.barNumber ?? "N/A"}
                </div>
              </div>

              <div className="card">
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", margin: "0 0 12px" }}>Specializations</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {((lawyerData?.specializations ?? []) as string[]).map((s: string) => (
                    <span key={s} className="badge badge-gold" style={{ fontSize: "0.62rem" }}>{s}</span>
                  ))}
                  {(lawyerData?.specializations as string[] ?? []).length === 0 && (
                    <span style={{ color: "var(--color-light)", fontSize: "0.82rem" }}>None set</span>
                  )}
                </div>
              </div>

              <div className="card">
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem", margin: "0 0 12px" }}>Court Admissions</h4>
                {((lawyerData?.courtAdmissions ?? []) as string[]).map((c: string) => (
                  <div key={c} style={{ fontSize: "0.82rem", color: "var(--color-mid)", marginBottom: 6, display: "flex", gap: 6 }}>
                    <span style={{ color: "var(--color-gold)" }}>⚖️</span> {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Right col — details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: 0 }}>Professional Biography</h3>
                  {!editMode && <button className="btn btn-outline" style={{ fontSize: "0.78rem" }} onClick={startEdit}>Edit</button>}
                </div>

                {editMode ? (
                  <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate({ biography: form.biography || undefined, specializations: form.specializations.length ? form.specializations : undefined, isAvailable: form.isAvailable }); }}>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Biography</label>
                      <textarea className="form-textarea" style={{ minHeight: 160 }}
                        placeholder="Professional biography..."
                        value={form.biography}
                        onChange={(e) => setForm(p => ({ ...p, biography: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="form-label">Specializations</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                        {PRACTICE_AREAS.map(area => (
                          <button key={area} type="button"
                            onClick={() => toggleSpecialization(area)}
                            style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", cursor: "pointer", fontFamily: "var(--font-sans)", border: `1px solid ${form.specializations.includes(area) ? "var(--color-gold)" : "var(--color-border)"}`, background: form.specializations.includes(area) ? "var(--color-gold)" : "transparent", color: form.specializations.includes(area) ? "white" : "var(--color-mid)", transition: "all 0.15s" }}>
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <input type="checkbox" id="avail" checked={form.isAvailable} onChange={(e) => setForm(p => ({ ...p, isAvailable: e.target.checked }))} />
                      <label htmlFor="avail" style={{ fontSize: "0.85rem", color: "var(--color-mid)", cursor: "pointer" }}>Available for new cases</label>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="submit" className="btn btn-primary" style={{ fontSize: "0.82rem" }} disabled={updateProfile.isLoading}>
                        {updateProfile.isLoading ? "Saving..." : "Save Profile"}
                      </button>
                      <button type="button" className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <p style={{ color: "var(--color-mid)", fontSize: "0.9rem", lineHeight: 1.75 }}>
                    {lawyerData?.biography ?? "No biography set. Click Edit to add your professional biography."}
                  </p>
                )}
              </div>

              <div className="card">
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 14px" }}>Qualifications & Memberships</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ color: "var(--color-gold)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Qualifications</div>
                    {((lawyerData?.qualifications ?? []) as string[]).map((q: string) => (
                      <div key={q} style={{ fontSize: "0.82rem", color: "var(--color-mid)", marginBottom: 5, display: "flex", gap: 6 }}>🎓 {q}</div>
                    ))}
                  </div>
                  <div>
                    <div style={{ color: "var(--color-gold)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Professional Memberships</div>
                    {((lawyerData?.professionalMemberships ?? []) as string[]).map((m: string) => (
                      <div key={m} style={{ fontSize: "0.82rem", color: "var(--color-mid)", marginBottom: 5, display: "flex", gap: 6 }}>🏛️ {m}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 14px" }}>Security</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Two-Factor Authentication</div>
                    <div style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>Secure your account with a TOTP authenticator</div>
                  </div>
                  <span className={`badge ${me?.twoFactorEnabled ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "0.62rem" }}>
                    {me?.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
                  <div style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>
                    Last login: {me?.lastLoginAt ? new Date(me.lastLoginAt).toLocaleString("en-NG") : "N/A"}
                  </div>
                  <Link href="/forgot-password">
                    <button className="btn btn-outline" style={{ fontSize: "0.75rem" }}>Change Password</button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

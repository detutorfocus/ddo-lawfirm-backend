// pages/client/profile.tsx
// ── Client profile — view and update personal info, 2FA setup

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function ClientProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useContext();
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const { data: profile } = trpc.client.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated });

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "",
    companyName: "", address: "", city: "", state: "",
  });

  const updateProfile = trpc.client.updateProfile.useMutation({
    onSuccess: () => { utils.client.getMyProfile.invalidate(); utils.auth.me.invalidate(); setEditMode(false); showToast("Profile updated successfully!"); },
    onError: (err) => showToast(`Error: ${err.message}`),
  });

  const setup2FA = trpc.auth.setup2FA.useMutation();
  const enable2FA = trpc.auth.enable2FA.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); setShow2FA(false); setTotpCode(""); showToast("Two-factor authentication enabled!"); },
    onError: (err) => showToast(`Error: ${err.message}`),
  });

  const startEdit = () => {
    setForm({
      firstName: me?.firstName ?? "",
      lastName: me?.lastName ?? "",
      phone: me?.phone ?? "",
      companyName: profile?.companyName ?? "",
      address: profile?.address ?? "",
      city: profile?.city ?? "",
      state: profile?.state ?? "",
    });
    setEditMode(true);
  };

  const NIGERIAN_STATES = ["FCT - Abuja","Lagos","Rivers","Kano","Ogun","Delta","Anambra","Imo","Enugu","Oyo","Osun","Ekiti","Ondo","Edo","Akwa Ibom","Cross River","Bayelsa","Benue","Kogi","Kwara","Kaduna","Zamfara","Kebbi","Sokoto","Niger","Nassarawa","Plateau","Gombe","Adamawa","Borno","Yobe","Taraba","Jigawa","Katsina","Abia","Ebonyi","Bauchi"];

  return (
    <>
      <Head><title>My Profile — Client Portal · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--color-dark)", color: "white", padding: "12px 18px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid var(--color-gold)" }}>
          {toast}
        </div>
      )}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/client/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>My Profile</h1>
          </div>

          {/* Profile card */}
          <div className="card" style={{ marginBottom: 20, borderTop: "3px solid var(--color-gold)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gold)", fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: "bold" }}>
                  {me?.firstName?.[0]}{me?.lastName?.[0]}
                </div>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", margin: "0 0 4px" }}>{me?.firstName} {me?.lastName}</h2>
                  <div style={{ color: "var(--color-gold)", fontSize: "0.82rem" }}>{me?.email}</div>
                  <div style={{ color: "var(--color-light)", fontSize: "0.78rem", marginTop: 2 }}>Client No: {profile?.clientNumber}</div>
                </div>
              </div>
              {!editMode && (
                <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={startEdit}>Edit Profile</button>
              )}
            </div>

            {!editMode ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  ["First Name", me?.firstName], ["Last Name", me?.lastName],
                  ["Email", me?.email], ["Phone", me?.phone ?? "Not set"],
                  ["Company", profile?.companyName ?? "N/A"], ["Industry", profile?.industry ?? "N/A"],
                  ["Address", profile?.address ?? "Not set"], ["City", profile?.city ?? "Not set"],
                  ["State", profile?.state ?? "Not set"], ["Country", "Nigeria"],
                ].map(([k, v]) => (
                  <div key={k} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 10 }}>
                    <div style={{ color: "var(--color-light)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{k}</div>
                    <div style={{ color: "var(--color-dark)", fontSize: "0.88rem" }}>{v}</div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(form); }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  {[
                    { label: "First Name", key: "firstName", type: "text" },
                    { label: "Last Name", key: "lastName", type: "text" },
                    { label: "Phone", key: "phone", type: "tel" },
                    { label: "Company Name", key: "companyName", type: "text" },
                    { label: "Address", key: "address", type: "text" },
                    { label: "City", key: "city", type: "text" },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" type={f.type} value={(form as any)[f.key]} onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <select className="form-select" value={form.state} onChange={(e) => setForm(p => ({ ...p, state: e.target.value }))}>
                      <option value="">Select state...</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: "0.82rem" }} disabled={updateProfile.isLoading}>
                    {updateProfile.isLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* Security card */}
          <div className="card">
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: 16 }}>Security Settings</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Two-Factor Authentication</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.8rem", marginTop: 2 }}>Add an extra layer of security using an authenticator app</div>
              </div>
              <div style={{ display: "flex", align: "center", gap: 10 }}>
                <span className={`badge ${me?.twoFactorEnabled ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "0.65rem" }}>{me?.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
                {!me?.twoFactorEnabled && (
                  <button className="btn btn-outline" style={{ fontSize: "0.78rem" }}
                    onClick={() => { setup2FA.mutate(); setShow2FA(true); }}>
                    Enable 2FA
                  </button>
                )}
              </div>
            </div>

            {show2FA && setup2FA.data && (
              <div style={{ marginTop: 16, padding: 16, background: "var(--color-cream)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <p style={{ color: "var(--color-mid)", fontSize: "0.85rem", marginBottom: 12 }}>
                  Scan this QR code with Google Authenticator, Authy, or any TOTP app:
                </p>
                <img src={setup2FA.data.qrCode} alt="2FA QR Code" style={{ width: 180, height: 180, margin: "0 auto 16px", display: "block", border: "4px solid white", borderRadius: "var(--radius-sm)" }} />
                <p style={{ color: "var(--color-light)", fontSize: "0.78rem", textAlign: "center", marginBottom: 14 }}>
                  Manual key: <code style={{ background: "var(--color-cream-light)", padding: "2px 6px", borderRadius: 3 }}>{setup2FA.data.secret}</code>
                </p>
                <div className="form-group" style={{ maxWidth: 240, margin: "0 auto" }}>
                  <label className="form-label" style={{ textAlign: "center", display: "block" }}>Enter 6-digit code to confirm</label>
                  <input className="form-input" maxLength={6} placeholder="000000"
                    style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.3em" }}
                    value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                  <button className="btn btn-primary" style={{ fontSize: "0.82rem" }}
                    disabled={totpCode.length !== 6 || enable2FA.isLoading}
                    onClick={() => enable2FA.mutate({ totpCode })}>
                    {enable2FA.isLoading ? "Verifying..." : "Activate 2FA"}
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => { setShow2FA(false); setTotpCode(""); }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Change Password</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.8rem", marginTop: 2 }}>Update your account password</div>
              </div>
              <Link href="/forgot-password">
                <button className="btn btn-outline" style={{ fontSize: "0.78rem" }}>Change Password</button>
              </Link>
            </div>

            <div style={{ padding: "14px 0", borderTop: "1px solid var(--color-border)" }}>
              <div style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>
                Last login: {me?.lastLoginAt ? new Date(me.lastLoginAt).toLocaleString("en-NG") : "N/A"}
                {" · "}Member since: {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" }) : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

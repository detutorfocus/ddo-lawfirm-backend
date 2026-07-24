// pages/admin/settings/index.tsx
// -- Platform settings -- firm info, feature flags, security config
//
// UPDATED: Previously all state was local-only (useState) and never
// persisted -- every toggle/edit was silently lost on refresh. Now
// backed by admin.getSettings / admin.updateSettings, which read/write
// a single WebsiteSettings row in the database. UI/layout unchanged.

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function AdminSettingsPage() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useContext();
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const [activeTab, setActiveTab] = useState<"firm" | "security" | "email" | "features">("firm");

  const { data: settings, isLoading } = trpc.admin.getSettings.useQuery(undefined, { enabled: isAuthenticated });
  const updateSettings = trpc.admin.updateSettings.useMutation({
    onSuccess: () => { utils.admin.getSettings.invalidate(); },
    onError: (err) => showToast(`Error: ${err.message}`),
  });

  // Local form state, seeded from the server once loaded. This keeps
  // inputs responsive while typing (no round-trip per keystroke) and
  // only calls the mutation when the user clicks Save.
  const [firmInfo, setFirmInfo] = useState({
    name: "", tagline: "", email: "", phone: "", address: "", website: "", rcNumber: "",
  });
  const [security, setSecurity] = useState({
    require2FA: false, maxLoginAttempts: 5, sessionDays: 7, rateLimitMax: 100,
  });
  const [features, setFeatures] = useState({
    enableConsultationBooking: true, enableNewsletter: true,
    enableClientPortal: true, enableDocumentUpload: true,
    enableOnlinePayments: false, enableVideoConsultation: false,
    maintenanceMode: false,
  });

  // Sync local form state once real settings arrive from the server.
  useEffect(() => {
    if (!settings) return;
    setFirmInfo({
      name: settings.firmName, tagline: settings.firmTagline, email: settings.firmEmail,
      phone: settings.firmPhone, address: settings.firmAddress, website: settings.firmWebsite,
      rcNumber: settings.firmRcNumber,
    });
    setSecurity({
      require2FA: settings.require2FA, maxLoginAttempts: settings.maxLoginAttempts,
      sessionDays: settings.sessionDays, rateLimitMax: settings.rateLimitMax,
    });
    setFeatures({
      enableConsultationBooking: settings.enableConsultationBooking,
      enableNewsletter: settings.enableNewsletter,
      enableClientPortal: settings.enableClientPortal,
      enableDocumentUpload: settings.enableDocumentUpload,
      enableOnlinePayments: settings.enableOnlinePayments,
      enableVideoConsultation: settings.enableVideoConsultation,
      maintenanceMode: settings.maintenanceMode,
    });
  }, [settings]);

  const saveFirmInfo = () => {
    updateSettings.mutate({
      firmName: firmInfo.name, firmTagline: firmInfo.tagline, firmEmail: firmInfo.email,
      firmPhone: firmInfo.phone, firmAddress: firmInfo.address, firmWebsite: firmInfo.website,
      firmRcNumber: firmInfo.rcNumber,
    }, { onSuccess: () => showToast("Firm information saved!") });
  };

  const saveSecurity = () => {
    updateSettings.mutate({ ...security }, { onSuccess: () => showToast("Security settings saved!") });
  };

  const saveFeatures = () => {
    updateSettings.mutate({ ...features }, { onSuccess: () => showToast("Feature flags updated!") });
  };

  const tabs: { key: "firm" | "security" | "email" | "features"; label: string; icon: string }[] = [
    { key: "firm", label: "Firm Info", icon: "\ud83c\udfdb\ufe0f" },
    { key: "security", label: "Security", icon: "\ud83d\udd10" },
    { key: "email", label: "Email Config", icon: "\u2709\ufe0f" },
    { key: "features", label: "Features", icon: "\u2699\ufe0f" },
  ];

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Settings — Admin · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--color-dark)", color: "white", padding: "12px 18px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid var(--color-gold)" }}>
          {toast}
        </div>
      )}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Platform Settings</h1>
          </div>

          <div style={{ display: "flex", gap: 2, borderBottom: "2px solid var(--color-border)", marginBottom: 20 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: "0.6rem 1rem", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: activeTab === t.key ? "var(--color-gold)" : "var(--color-light)", borderBottom: activeTab === t.key ? "2px solid var(--color-gold)" : "2px solid transparent", marginBottom: -2, display: "flex", alignItems: "center", gap: 6 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {activeTab === "firm" && (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 18px" }}>Firm Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "Firm Name", key: "name" }, { label: "Tagline", key: "tagline" },
                  { label: "Primary Email", key: "email" }, { label: "Phone Number", key: "phone" },
                  { label: "Website URL", key: "website" }, { label: "RC/CAC Number", key: "rcNumber" },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" value={(firmInfo as any)[f.key]} onChange={e => setFirmInfo(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Office Address</label>
                  <input className="form-input" value={firmInfo.address} onChange={e => setFirmInfo(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button className="btn btn-primary" style={{ fontSize: "0.85rem" }} onClick={saveFirmInfo} disabled={updateSettings.isLoading}>
                  {updateSettings.isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 18px" }}>Security Configuration</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Require 2FA for all users", sub: "Force all lawyers and clients to enable two-factor authentication", key: "require2FA" },
                ].map(s => (
                  <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.label}</div>
                      <div style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>{s.sub}</div>
                    </div>
                    <div onClick={() => setSecurity(p => ({ ...p, [s.key]: !(p as any)[s.key] }))}
                      style={{ width: 44, height: 24, borderRadius: 12, background: (security as any)[s.key] ? "var(--color-gold)" : "var(--color-border)", cursor: "pointer", position: "relative", transition: "all 0.25s" }}>
                      <div style={{ position: "absolute", top: 2, left: (security as any)[s.key] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "all 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
                    </div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Max Login Attempts</label>
                    <input className="form-input" type="number" min={3} max={20} value={security.maxLoginAttempts} onChange={e => setSecurity(p => ({ ...p, maxLoginAttempts: parseInt(e.target.value) || 5 }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Duration (days)</label>
                    <input className="form-input" type="number" min={1} max={30} value={security.sessionDays} onChange={e => setSecurity(p => ({ ...p, sessionDays: parseInt(e.target.value) || 7 }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">API Rate Limit (req/min)</label>
                    <input className="form-input" type="number" min={10} max={1000} value={security.rateLimitMax} onChange={e => setSecurity(p => ({ ...p, rateLimitMax: parseInt(e.target.value) || 100 }))} />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ fontSize: "0.85rem", alignSelf: "flex-start" }} onClick={saveSecurity} disabled={updateSettings.isLoading}>
                  {updateSettings.isLoading ? "Saving..." : "Save Security Settings"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 8px" }}>Email Configuration</h3>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", marginBottom: 18 }}>Email settings are managed via environment variables. Current provider: <strong>Resend</strong></p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { label: "From Address", val: "D.D. Onietan & Co. <noreply@ddonietanandco.com>" },
                  { label: "Reply-To", val: "info@ddonietanandco.com" },
                  { label: "Provider", val: "Resend (resend.com)" },
                  { label: "Domain", val: "ddonietanandco.com" },
                ].map(f => (
                  <div key={f.label} style={{ padding: "12px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ color: "var(--color-light)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{f.label}</div>
                    <div style={{ color: "var(--color-dark)", fontSize: "0.88rem", fontFamily: "monospace" }}>{f.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: "14px", background: "var(--color-cream)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <div style={{ color: "var(--color-mid)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  💡 To update email settings, modify the <code style={{ background: "white", padding: "1px 5px", borderRadius: 3 }}>RESEND_API_KEY</code> and <code style={{ background: "white", padding: "1px 5px", borderRadius: 3 }}>EMAIL_FROM</code> environment variables in your deployment platform.
                </div>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 18px" }}>Feature Flags</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { key: "enableConsultationBooking", label: "Consultation Booking", sub: "Allow website visitors to book consultations via the public form" },
                  { key: "enableNewsletter", label: "Newsletter Subscription", sub: "Show newsletter subscription form on the public website" },
                  { key: "enableClientPortal", label: "Client Portal", sub: "Allow clients to register and log in to the client portal" },
                  { key: "enableDocumentUpload", label: "Document Upload", sub: "Allow clients and lawyers to upload documents" },
                  { key: "enableOnlinePayments", label: "Online Payments", sub: "Enable online invoice payments (Paystack/Flutterwave integration required)" },
                  { key: "enableVideoConsultation", label: "Video Consultation", sub: "Enable video call booking (Zoom/Google Meet integration required)" },
                  { key: "maintenanceMode", label: "Maintenance Mode", sub: "⚠️ Take the website offline for maintenance. Show maintenance page to visitors." },
                ].map(f => (
                  <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ flex: 1, paddingRight: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: f.key === "maintenanceMode" ? "#c62828" : "var(--color-dark)" }}>{f.label}</div>
                      <div style={{ color: "var(--color-light)", fontSize: "0.78rem", marginTop: 2 }}>{f.sub}</div>
                    </div>
                    <div onClick={() => setFeatures(p => ({ ...p, [f.key]: !(p as any)[f.key] }))}
                      style={{ width: 44, height: 24, borderRadius: 12, background: (features as any)[f.key] ? (f.key === "maintenanceMode" ? "#c62828" : "var(--color-gold)") : "var(--color-border)", cursor: "pointer", position: "relative", transition: "all 0.25s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: (features as any)[f.key] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "all 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ fontSize: "0.85rem", marginTop: 20 }} onClick={saveFeatures} disabled={updateSettings.isLoading}>
                {updateSettings.isLoading ? "Saving..." : "Save Feature Settings"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

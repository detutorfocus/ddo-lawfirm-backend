// pages/admin/lawyers/new.tsx
// ── Admin: create new lawyer portal account

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PRACTICE_AREAS } from "@/types/index";

export default function NewLawyerPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 5000); };

  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", phone: "",
    barNumber: "", title: "Esq.", position: "",
    biography: "", specializations: [] as string[],
    qualifications: [""], yearsOfExperience: 1, hourlyRate: 50000,
  });

  const create = trpc.admin.createLawyerAccount.useMutation({
    onSuccess: (data) => {
      showToast(`✅ Account created! Temporary password: ${data.tempPassword}`);
      setTimeout(() => router.push("/admin/users"), 4000);
    },
    onError: (err) => showToast(`❌ Error: ${err.message}`),
  });

  const toggleSpec = (area: string) => {
    setForm(p => ({
      ...p,
      specializations: p.specializations.includes(area)
        ? p.specializations.filter(s => s !== area)
        : [...p.specializations, area],
    }));
  };

  const addQualification = () => setForm(p => ({ ...p, qualifications: [...p.qualifications, ""] }));
  const updateQual = (idx: number, val: string) => setForm(p => ({ ...p, qualifications: p.qualifications.map((q, i) => i === idx ? val : q) }));
  const removeQual = (idx: number) => setForm(p => ({ ...p, qualifications: p.qualifications.filter((_, i) => i !== idx) }));

  const POSITIONS = ["Principal Partner", "Senior Partner", "Managing Partner", "Partner", "Associate Partner", "Senior Associate", "Associate", "Legal Officer"];
  const TITLES = ["SAN", "Esq.", "Dr.", "Prof."];

  return (
    <>
      <Head><title>Create Lawyer Account — Admin · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, left: 24, maxWidth: 500, margin: "0 auto", background: toast.startsWith("✅") ? "#e8f5e9" : "#fce4ec", color: toast.startsWith("✅") ? "#2e7d32" : "#c62828", padding: "14px 18px", borderRadius: "var(--radius-md)", fontSize: "0.88rem", zIndex: 9999, boxShadow: "var(--shadow-lg)", border: `1px solid ${toast.startsWith("✅") ? "#a5d6a7" : "#f48fb1"}` }}>
          {toast}
        </div>
      )}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/users"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← User Management</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Create Lawyer Account</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>A temporary password will be generated and emailed to the lawyer.</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              ...form,
              qualifications: form.qualifications.filter(q => q.trim()),
            });
          }}>
            {/* Personal Info */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>Personal Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" required placeholder="lawyer@ddonietanandco.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" type="tel" placeholder="+234 XXX XXXX XXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>Professional Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Bar Number / NBA Number *</label>
                  <input className="form-input" required placeholder="NBA/ABJ/2024/XXXX" value={form.barNumber} onChange={e => setForm(p => ({ ...p, barNumber: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <select className="form-select" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}>
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position *</label>
                  <select className="form-select" required value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}>
                    <option value="">Select position...</option>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input className="form-input" type="number" min={0} max={60} required value={form.yearsOfExperience} onChange={e => setForm(p => ({ ...p, yearsOfExperience: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hourly Rate (₦)</label>
                  <input className="form-input" type="number" min={0} value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Biography *</label>
                <textarea className="form-textarea" style={{ minHeight: 140 }} required placeholder="Professional biography (min. 20 characters)..." value={form.biography} onChange={e => setForm(p => ({ ...p, biography: e.target.value }))} />
              </div>

              {/* Qualifications */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Qualifications</label>
                  <button type="button" onClick={addQualification} style={{ background: "none", border: "none", color: "var(--color-gold)", cursor: "pointer", fontSize: "0.82rem", fontFamily: "var(--font-sans)" }}>+ Add</button>
                </div>
                {form.qualifications.map((q, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input className="form-input" placeholder={`e.g. LLB (Hons) University of Lagos`} value={q} onChange={e => updateQual(idx, e.target.value)} />
                    {form.qualifications.length > 1 && (
                      <button type="button" onClick={() => removeQual(idx)} style={{ background: "none", border: "1px solid #f48fb1", borderRadius: "var(--radius-sm)", color: "#c62828", cursor: "pointer", padding: "0 10px", fontSize: "0.85rem" }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Specializations */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
                Specializations * <span style={{ color: "var(--color-light)", fontSize: "0.78rem", fontFamily: "var(--font-sans)", fontWeight: 400 }}>Select at least one</span>
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRACTICE_AREAS.map(area => (
                  <button key={area} type="button" onClick={() => toggleSpec(area)}
                    style={{ padding: "6px 12px", borderRadius: 20, fontSize: "0.78rem", cursor: "pointer", fontFamily: "var(--font-sans)", border: `1px solid ${form.specializations.includes(area) ? "var(--color-gold)" : "var(--color-border)"}`, background: form.specializations.includes(area) ? "var(--color-gold)" : "transparent", color: form.specializations.includes(area) ? "white" : "var(--color-mid)", transition: "all 0.15s" }}>
                    {area}
                  </button>
                ))}
              </div>
              {form.specializations.length > 0 && (
                <div style={{ marginTop: 10, color: "var(--color-gold)", fontSize: "0.78rem" }}>
                  Selected: {form.specializations.join(", ")}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Link href="/admin/users"><button type="button" className="btn btn-ghost">Cancel</button></Link>
              <button type="submit" className="btn btn-primary"
                disabled={create.isLoading || !form.email || !form.firstName || !form.barNumber || !form.position || form.specializations.length === 0}
                style={{ minWidth: 180 }}>
                {create.isLoading ? "Creating Account..." : "Create Lawyer Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

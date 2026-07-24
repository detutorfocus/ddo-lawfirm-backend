// pages/admin/staff/new.tsx
// -- Admin: create a new staff account for any non-lawyer role
// (Managing Partner, Legal Assistant, Secretary, Receptionist,
// Finance Officer). Complements admin/lawyers/new.tsx, which handles
// the lawyer-specific fields (bar number, specializations, etc.) that
// don't apply here. Per the spec, staff can ONLY be created by an
// Admin -- there is no public registration path for these roles.

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const STAFF_ROLE_OPTIONS = [
  { value: "MANAGING_PARTNER", label: "Managing Partner" },
  { value: "LEGAL_ASSISTANT", label: "Legal Assistant" },
  { value: "SECRETARY", label: "Secretary" },
  { value: "RECEPTIONIST", label: "Receptionist" },
  { value: "FINANCE_OFFICER", label: "Finance Officer" },
];

export default function NewStaffPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 6000); };

  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", phone: "", role: "",
  });

  const create = trpc.admin.createEmployee.useMutation({
    onSuccess: (data) => {
      showToast(`✅ Account created! Temporary password: ${data.tempPassword}`);
      setTimeout(() => router.push("/admin/users"), 5000);
    },
    onError: (err) => showToast(`❌ Error: ${err.message}`),
  });

  const canSubmit = form.email && form.firstName && form.lastName && form.role;

  return (
    <>
      <Head><title>Create Staff Account — Admin · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, left: 24, maxWidth: 500, margin: "0 auto", background: toast.startsWith("✅") ? "#e8f5e9" : "#fce4ec", color: toast.startsWith("✅") ? "#2e7d32" : "#c62828", padding: "14px 18px", borderRadius: "var(--radius-md)", fontSize: "0.88rem", zIndex: 9999, boxShadow: "var(--shadow-lg)", border: `1px solid ${toast.startsWith("✅") ? "#a5d6a7" : "#f48fb1"}` }}>
          {toast}
        </div>
      )}
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/users"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← User Management</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Create Staff Account</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>
              For Managing Partners, Legal Assistants, Secretaries, Receptionists, and Finance Officers.
              For lawyer accounts, use <Link href="/admin/lawyers/new" style={{ color: "var(--color-gold)" }}>Create Lawyer Account</Link> instead.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); create.mutate(form as any); }}>
            <div className="card">
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>Staff Details</h3>
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
                  <input className="form-input" type="email" required placeholder="employee@ddonietanandco.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" type="tel" placeholder="+234 XXX XXXX XXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Role *</label>
                  <select className="form-select" required value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="">Select a role...</option>
                    {STAFF_ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 20, padding: "14px", background: "var(--color-cream)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <div style={{ color: "var(--color-mid)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                  💡 A temporary password will be generated automatically and emailed to the employee.
                  They will be required to change it on first login.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <Link href="/admin/users"><button type="button" className="btn btn-ghost">Cancel</button></Link>
              <button type="submit" className="btn btn-primary" disabled={!canSubmit || create.isLoading} style={{ minWidth: 180 }}>
                {create.isLoading ? "Creating Account..." : "Create Staff Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

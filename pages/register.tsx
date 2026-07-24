// pages/register.tsx
// ── Client self-registration page

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "src/lib/trpc";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const register = trpc.auth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    register.mutate({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined });
  };

  return (
    <>
      <Head><title>Create Account — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <Link href="/">
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--color-dark)", border: "2px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", cursor: "pointer" }}>
              <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-serif)", fontWeight: "bold", fontSize: 16 }}>DDO</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: "0 0 4px" }}>Create Client Account</h1>
          <p style={{ color: "var(--color-light)", fontSize: "0.82rem" }}>D.D. Onietan (SAN) & Co. · Client Portal</p>
        </div>

        {success ? (
          <div className="card" style={{ maxWidth: 440, width: "100%", textAlign: "center", padding: "2.5rem" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: 12 }}>Account Created!</h2>
            <p style={{ color: "var(--color-mid)", fontSize: "0.9rem", marginBottom: 20 }}>
              Please check your email and click the verification link to activate your account.
            </p>
            <Link href="/login"><button className="btn btn-primary" style={{ width: "100%" }}>Go to Login</button></Link>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 500, width: "100%", padding: "2.5rem" }}>
            {error && (
              <div style={{ background: "#fce4ec", color: "#c62828", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1rem", border: "1px solid #f48fb1" }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" required placeholder="First name" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" required placeholder="Last name" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" required placeholder="your@email.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" placeholder="+234 XXX XXXX XXX" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" required minLength={8} placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                <span style={{ fontSize: "0.72rem", color: "var(--color-light)" }}>Must contain uppercase, number, and special character</span>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input className="form-input" type="password" required placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 4 }} disabled={register.isLoading}>
                {register.isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.85rem", color: "var(--color-light)" }}>
              Already have an account? <Link href="/login" style={{ color: "var(--color-gold)", fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        )}
        <Link href="/" style={{ marginTop: "1.25rem", color: "var(--color-light)", fontSize: "0.78rem" }}>← Return to Main Website</Link>
      </div>
    </>
  );
}

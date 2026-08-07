// pages/reset-password.tsx
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query as { token: string };
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  return (
    <>
      <Head><title>Reset Password — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div className="card" style={{ maxWidth: 400, width: "100%", padding: "2.5rem" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontFamily: "var(--font-serif)", marginBottom: 12 }}>Password Reset!</h2>
              <p style={{ color: "var(--color-mid)", fontSize: "0.88rem", marginBottom: 20 }}>Your password has been updated. Please sign in with your new password.</p>
              <Link href="/login"><button className="btn btn-primary" style={{ width: "100%" }}>Sign In</button></Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", marginBottom: "1.25rem" }}>Set New Password</h2>
              {error && <div style={{ background: "#fce4ec", color: "#c62828", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</div>}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
                reset.mutate({ token, newPassword: form.password });
              }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" required minLength={8} placeholder="New password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" required placeholder="Confirm password" value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={reset.isLoading}>{reset.isLoading ? "Resetting..." : "Reset Password"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

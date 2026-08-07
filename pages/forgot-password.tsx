// pages/forgot-password.tsx
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const forgot = trpc.auth.forgotPassword.useMutation({ onSuccess: () => setSubmitted(true) });

  return (
    <>
      <Head><title>Forgot Password — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <Link href="/">
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-dark)", border: "2px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", cursor: "pointer" }}>
              <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-serif)", fontWeight: "bold", fontSize: 14 }}>DDO</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", margin: 0 }}>Reset Password</h1>
        </div>

        <div className="card" style={{ maxWidth: 400, width: "100%", padding: "2.25rem" }}>
          {submitted ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <h3 style={{ fontFamily: "var(--font-serif)", marginBottom: 10 }}>Check Your Email</h3>
              <p style={{ color: "var(--color-mid)", fontSize: "0.88rem", marginBottom: 20 }}>
                If an account exists for <strong>{email}</strong>, a password reset link has been sent. Please check your inbox.
              </p>
              <Link href="/login"><button className="btn btn-primary" style={{ width: "100%" }}>Back to Login</button></Link>
            </div>
          ) : (
            <>
              <p style={{ color: "var(--color-mid)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
                Enter your account email address and we will send you a password reset link.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); forgot.mutate({ email }); }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={forgot.isLoading}>
                  {forgot.isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.82rem", color: "var(--color-light)" }}>
                <Link href="/login" style={{ color: "var(--color-gold)" }}>← Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

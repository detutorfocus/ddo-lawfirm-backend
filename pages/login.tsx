// pages/login.tsx
// ── Unified login page for Client, Lawyer, Admin

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "src/hooks/useAuth";
import { type UserRoleType } from "src/types/index";

type LoginStep = "credentials" | "2fa";
type PortalType = "client" | "lawyer" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const [portalType, setPortalType] = useState<PortalType>("client");
  const [step, setStep] = useState<LoginStep>("credentials");
  const [form, setForm] = useState({ email: "", password: "", totpCode: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const redirectMap: Record<UserRoleType, string> = {
        ["ADMIN"]: "/admin/dashboard",
        ["LAWYER"]: "/lawyer/dashboard",
        ["CLIENT"]: "/client/dashboard",
      };
      router.push((router.query.callbackUrl as string) ?? redirectMap[user.role]);
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await login(form.email, form.password, step === "2fa" ? form.totpCode : undefined);

      if (result?.error) {
        if (result.error === "TWO_FACTOR_REQUIRED") {
          setStep("2fa");
        } else {
          setError("Invalid email or password. Please try again.");
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const portalLabels: Record<PortalType, string> = {
    client: "Client Portal",
    lawyer: "Lawyer Portal",
    admin: "Admin Portal",
  };

  return (
    <>
      <Head>
        <title>Sign In — D.D. Onietan (SAN) & Co.</title>
      </Head>

      <div style={{ minHeight: "100vh", background: "var(--color-cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>

        {/* Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/">
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-dark)", border: "2px solid var(--color-gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", cursor: "pointer" }}>
              <span style={{ color: "var(--color-gold)", fontFamily: "var(--font-serif)", fontWeight: "bold", fontSize: 20 }}>DDO</span>
            </div>
          </Link>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--color-dark)", marginBottom: 4 }}>D.D. Onietan (SAN) & Co.</h1>
          <p style={{ color: "var(--color-light)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Barristers & Solicitors</p>
        </div>

        {/* Portal Tabs */}
        <div style={{ display: "flex", background: "var(--color-white)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: 4, marginBottom: "1.5rem", gap: 4 }}>
          {(["client", "lawyer", "admin"] as PortalType[]).map((type) => (
            <button
              key={type}
              onClick={() => { setPortalType(type); setError(""); setStep("credentials"); }}
              style={{
                padding: "8px 20px", borderRadius: "var(--radius-sm)", fontSize: "0.8rem",
                fontWeight: 600, letterSpacing: "0.05em", textTransform: "capitalize",
                border: "none", cursor: "pointer", transition: "all 0.2s",
                background: portalType === type ? "var(--color-dark)" : "transparent",
                color: portalType === type ? "var(--color-gold)" : "var(--color-light)",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Login Card */}
        <div className="card" style={{ width: "100%", maxWidth: 420, padding: "2.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", marginBottom: 6 }}>
            {portalLabels[portalType]}
          </h2>
          <p style={{ color: "var(--color-light)", fontSize: "0.85rem", marginBottom: "1.75rem" }}>
            {step === "credentials" ? "Enter your credentials to access your dashboard" : "Enter the 6-digit code from your authenticator app"}
          </p>

          {error && (
            <div style={{ background: "#fce4ec", color: "#c62828", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", marginBottom: "1rem", border: "1px solid #f48fb1" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {step === "credentials" ? (
              <>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                  />
                </div>
                <div style={{ textAlign: "right" }}>
                  <Link href="/forgot-password" style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>
                    Forgot password?
                  </Link>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">Two-Factor Authentication Code</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  pattern="\d{6}"
                  required
                  value={form.totpCode}
                  onChange={(e) => setForm((p) => ({ ...p, totpCode: e.target.value.replace(/\D/g, "") }))}
                  autoComplete="one-time-code"
                  autoFocus
                  style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.4em" }}
                />
                <p style={{ fontSize: "0.75rem", color: "var(--color-light)", textAlign: "center" }}>
                  Open your authenticator app and enter the 6-digit code
                </p>
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  style={{ background: "none", border: "none", color: "var(--color-gold)", fontSize: "0.8rem", cursor: "pointer", marginTop: "0.5rem" }}
                >
                  ← Back to login
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={submitting}
            >
              {submitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <span className="spinner" style={{ width: 16, height: 16 }}></span>
                  Signing in...
                </span>
              ) : (
                step === "credentials" ? "Sign In to Portal" : "Verify & Sign In"
              )}
            </button>
          </form>

          {portalType === "client" && (
            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--color-light)" }}>
              Don't have an account?{" "}
              <Link href="/register" style={{ color: "var(--color-gold)", fontWeight: 600 }}>
                Register here
              </Link>
            </p>
          )}
        </div>

        <Link href="/" style={{ marginTop: "1.5rem", color: "var(--color-light)", fontSize: "0.8rem" }}>
          ← Return to Main Website
        </Link>
      </div>
    </>
  );
}

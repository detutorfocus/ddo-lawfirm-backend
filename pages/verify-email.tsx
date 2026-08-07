// pages/verify-email.tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "@/lib/trpc";
export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query as { token?: string };
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading");
  const verify = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => setStatus("success"),
    onError: () => setStatus("error"),
  });
  useEffect(() => { if (token) verify.mutate({ token }); }, [token]);
  return (
    <>
      <Head><title>Verify Email — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Arial,sans-serif" }}>
        <div style={{ background: "white", border: "1px solid #E8DDD0", borderTop: "4px solid #C9A84C", borderRadius: 8, padding: "2.5rem", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          {status === "loading" && (<><div style={{ width: 40, height: 40, border: "3px solid #E8DDD0", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }}></div><p style={{ color: "#888" }}>Verifying your email address...</p></>)}
          {status === "success" && (<><div style={{ fontSize: 48, marginBottom: 14 }}>✅</div><h2 style={{ fontFamily: "Georgia,serif", color: "#1A1A1A", marginBottom: 10 }}>Email Verified!</h2><p style={{ color: "#888", marginBottom: 20, lineHeight: 1.7 }}>Your email has been verified. You can now sign in to your account.</p><Link href="/login"><button style={{ background: "linear-gradient(135deg,#C9A84C,#8B7536)", color: "white", border: "none", padding: "12px 28px", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>Sign In Now</button></Link></>)}
          {status === "error" && (<><div style={{ fontSize: 48, marginBottom: 14 }}>❌</div><h2 style={{ fontFamily: "Georgia,serif", color: "#1A1A1A", marginBottom: 10 }}>Verification Failed</h2><p style={{ color: "#888", marginBottom: 20, lineHeight: 1.7 }}>This link may have expired or already been used. Please request a new verification email.</p><Link href="/login"><button style={{ background: "transparent", border: "2px solid #C9A84C", color: "#C9A84C", padding: "12px 24px", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Back to Login</button></Link></>)}
        </div>
      </div>
    </>
  );
}

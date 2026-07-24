// pages/unauthorized.tsx
import Head from "next/head";
import Link from "next/link";
export default function UnauthorizedPage() {
  return (
    <>
      <Head><title>Access Denied — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: "5rem", color: "#C9A84C", fontFamily: "Georgia,serif", fontWeight: "bold", lineHeight: 1, marginBottom: 16 }}>403</div>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: "1.75rem", marginBottom: 12, color: "#1A1A1A" }}>Access Denied</h1>
        <p style={{ color: "#888", fontSize: "0.95rem", maxWidth: 400, marginBottom: 28, lineHeight: 1.7 }}>You do not have permission to access this page. Please contact an administrator if you believe this is an error.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/"><button style={{ background: "linear-gradient(135deg,#C9A84C,#8B7536)", color: "white", border: "none", padding: "12px 24px", borderRadius: 4, cursor: "pointer", fontFamily: "Arial", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>Return Home</button></Link>
          <Link href="/login"><button style={{ background: "transparent", color: "#C9A84C", border: "2px solid #C9A84C", padding: "12px 24px", borderRadius: 4, cursor: "pointer", fontFamily: "Arial", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>Login Again</button></Link>
        </div>
      </div>
    </>
  );
}

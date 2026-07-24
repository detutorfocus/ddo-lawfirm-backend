// pages/404.tsx
import Head from "next/head";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Head><title>Page Not Found — D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "var(--font-sans)", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: "6rem", color: "var(--color-gold)", lineHeight: 1, marginBottom: 16, fontWeight: "bold" }}>404</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", marginBottom: 12 }}>Page Not Found</h1>
        <p style={{ color: "var(--color-mid)", fontSize: "0.95rem", maxWidth: 400, marginBottom: 28, lineHeight: 1.7 }}>
          The page you are looking for does not exist or has been moved. Please return to our homepage.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/"><button className="btn btn-primary">Return to Homepage</button></Link>
          <Link href="/login"><button className="btn btn-outline">Client Portal</button></Link>
        </div>
        <div style={{ marginTop: 48, padding: "1.25rem 2rem", background: "white", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", borderTop: "3px solid var(--color-gold)" }}>
          <div style={{ fontFamily: "var(--font-serif)", color: "var(--color-gold)", fontSize: "0.85rem", letterSpacing: 1 }}>D.D. ONIETAN (SAN) & CO.</div>
          <div style={{ color: "var(--color-light)", fontSize: "0.75rem", letterSpacing: 2, marginTop: 2 }}>BARRISTERS & SOLICITORS</div>
        </div>
      </div>
    </>
  );
}

// pages/admin/publications/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePagination } from "@/hooks/index";

export default function AdminPublicationsPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination();
  const utils = trpc.useContext();
  const { data, isLoading } = trpc.publication.getAll.useQuery({ page, pageSize }, { enabled: isAuthenticated });
  const del = trpc.publication.delete.useMutation({ onSuccess: () => utils.publication.getAll.invalidate() });
  return (
    <>
      <Head><title>Publications — Admin</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Publications</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} articles</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isLoading ? <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
              : data?.publications?.length === 0 ? <div className="card" style={{ textAlign: "center", padding: "3rem" }}><p style={{ color: "var(--color-light)" }}>No publications yet.</p></div>
              : data?.publications?.map(pub => (
                <div key={pub.id} className="card" style={{ borderLeft: "4px solid var(--color-gold)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ background: "rgba(201,168,76,0.12)", color: "#8B7536", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{pub.category}</span>
                      <span style={{ background: pub.status === "PUBLISHED" ? "#e8f5e9" : "#f5f5f5", color: pub.status === "PUBLISHED" ? "#2e7d32" : "#757575", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{pub.status}</span>
                      <span style={{ color: "var(--color-light)", fontSize: "0.72rem" }}>👁 {pub.viewCount} views</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--color-dark)", marginBottom: 4 }}>{pub.title}</div>
                    <div style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>
                      By {pub.author.user.firstName} {pub.author.user.lastName} · {pub.publishedAt ? new Date(pub.publishedAt).toLocaleDateString("en-NG") : "Draft"}
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: "0.72rem", color: "#c62828", flexShrink: 0 }}
                    onClick={() => { if (window.confirm("Delete this publication?")) del.mutate({ id: pub.id }); }}>Delete</button>
                </div>
              ))}
          </div>
          {data && data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span style={{ color: "var(--color-mid)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>Page {page} of {data.totalPages}</span>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

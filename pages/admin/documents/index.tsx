// pages/admin/documents/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePagination, useDebounce } from "@/hooks/index";

export default function AdminDocumentsPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | "">("");
  const dSearch = useDebounce(search, 350);
  const utils = trpc.useContext();

  const { data, isLoading } = trpc.document.list.useQuery(
    { page, pageSize, type: typeFilter || undefined, search: dSearch || undefined },
    { enabled: isAuthenticated }
  );
  const getDownload = trpc.document.getDownloadUrl.useMutation({
    onSuccess: ({ downloadUrl }) => window.open(downloadUrl, "_blank"),
  });
  const deleteDoc = trpc.document.delete.useMutation({
    onSuccess: () => utils.document.list.invalidate(),
  });

  const formatSize = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <>
      <Head><title>Documents — Admin</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Document Library</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} total documents</p>
          </div>

          <div className="card" style={{ marginBottom: 16, padding: "0.875rem 1.25rem" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="Search by title or filename..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              <select className="form-select" style={{ minWidth: 180 }} value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value as string | ""); setPage(1); }}>
                <option value="">All Types</option>
                {["COURT_FILING","AFFIDAVIT","CONTRACT","EVIDENCE","JUDGMENT","LEGAL_OPINION","INVOICE","CORRESPONDENCE","OTHER"].map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
              {(search || typeFilter) && (
                <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }}
                  onClick={() => { setSearch(""); setTypeFilter(""); }}>Clear</button>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Title</th><th>Type</th><th>Case</th><th>Uploaded By</th><th>Size</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {data?.documents?.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No documents found.</td></tr>
                    ) : data?.documents?.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>📄 {doc.title}</div>
                          <div style={{ color: "var(--color-light)", fontSize: "0.72rem", fontFamily: "monospace" }}>{doc.fileName}</div>
                        </td>
                        <td><span className="badge badge-neutral" style={{ fontSize: "0.6rem" }}>{doc.type.replace(/_/g, " ")}</span></td>
                        <td style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>{doc.case?.caseNumber ?? "—"}</td>
                        <td style={{ fontSize: "0.82rem", color: "var(--color-mid)" }}>{doc.uploadedById?.slice(0, 8)}...</td>
                        <td style={{ color: "var(--color-light)", fontSize: "0.8rem" }}>{formatSize(doc.fileSize)}</td>
                        <td style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>
                          {new Date(doc.createdAt).toLocaleDateString("en-NG")}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem" }}
                              onClick={() => getDownload.mutate({ documentId: doc.id })}>⬇</button>
                            <button className="btn btn-ghost" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem", color: "#c62828" }}
                              onClick={() => { if (window.confirm("Delete this document permanently?")) deleteDoc.mutate({ documentId: doc.id }); }}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

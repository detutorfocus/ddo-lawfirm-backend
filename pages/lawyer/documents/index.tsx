// pages/lawyer/documents/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useUpload } from "@/hooks/index";

export default function LawyerDocumentsPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useContext();
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<string>("OTHER");
  const fileRef = useState<HTMLInputElement | null>(null);
  const { data, isLoading } = trpc.document.list.useQuery({ page: 1, pageSize: 50 }, { enabled: isAuthenticated });
  const getDownload = trpc.document.getDownloadUrl.useMutation({ onSuccess: ({ downloadUrl }) => window.open(downloadUrl, "_blank") });
  const { upload, isUploading, progress, reset } = useUpload({ onSuccess: () => { utils.document.list.invalidate(); setShowUpload(false); setTitle(""); reset(); }});
  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return (
    <>
      <Head><title>Documents — Lawyer Portal</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
            <div>
              <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Documents</h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} documents</p>
            </div>
            <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? "Cancel" : "+ Upload Document"}
            </button>
          </div>
          {showUpload && (
            <div className="card" style={{ marginBottom: 20, borderLeft: "3px solid var(--color-gold)" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 14 }}>Upload New Document</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div className="form-group"><label className="form-label">Document Title *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Statement of Defence" /></div>
                <div className="form-group"><label className="form-label">Document Type</label>
                  <select className="form-select" value={docType} onChange={e => setDocType(e.target.value as string)}>
                    {["COURT_FILING","AFFIDAVIT","CONTRACT","EVIDENCE","JUDGMENT","LEGAL_OPINION","INVOICE","CORRESPONDENCE","OTHER"].map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>
              {isUploading ? (
                <div><div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}><div style={{ height: "100%", background: "var(--color-gold)", width: `${progress}%`, transition: "width 0.3s" }}></div></div><p style={{ color: "var(--color-mid)", fontSize: "0.85rem" }}>Uploading... {progress}%</p></div>
              ) : (
                <label style={{ display: "block", border: "2px dashed var(--color-gold)", borderRadius: 8, padding: "1.5rem", textAlign: "center", cursor: title ? "pointer" : "not-allowed", opacity: title ? 1 : 0.5 }}>
                  <span style={{ color: "var(--color-mid)", fontSize: "0.9rem" }}>📁 {title ? "Click to select a file (PDF, DOCX, XLSX, JPG, PNG — max 50MB)" : "Enter document title first"}</span>
                  <input type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" style={{ display: "none" }} disabled={!title}
                    onChange={async e => { const f = e.target.files?.[0]; if (f && title) await upload(f, title, docType); }} />
                </label>
              )}
            </div>
          )}
          {isLoading ? <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Title</th><th>Type</th><th>Case</th><th>Size</th><th>Uploaded</th><th>Action</th></tr></thead>
                  <tbody>
                    {data?.documents?.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No documents yet.</td></tr>
                    ) : data?.documents?.map(doc => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 500 }}>📄 {doc.title}</td>
                        <td><span style={{ background: "var(--color-cream)", color: "var(--color-mid)", padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>{doc.type}</span></td>
                        <td style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>{doc.case?.caseNumber ?? "—"}</td>
                        <td style={{ color: "var(--color-light)", fontSize: "0.8rem" }}>{formatSize(doc.fileSize)}</td>
                        <td style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>{new Date(doc.createdAt).toLocaleDateString("en-NG")}</td>
                        <td><button className="btn btn-outline" style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }} onClick={() => getDownload.mutate({ documentId: doc.id })}>⬇ Download</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

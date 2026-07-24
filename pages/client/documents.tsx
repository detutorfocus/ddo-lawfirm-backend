// pages/client/documents.tsx
// ── Client document library — view, download, and upload evidence
// directly to a specific lawyer or admin.
//
// UPDATED: Upload panel now requires selecting a recipient (a specific
// lawyer, or "Admin — General Inquiry") before a file can be sent. This
// makes the upload flow function as "send this evidence TO someone",
// not just "attach a file with no addressee".

import { useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useUpload } from "@/hooks/index";
import { usePagination } from "@/hooks/index";

const DOC_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
};

const DOCUMENT_TYPES = [
  { value: "EVIDENCE", label: "Evidence" },
  { value: "AFFIDAVIT", label: "Affidavit" },
  { value: "CONTRACT", label: "Contract" },
  { value: "COURT_FILING", label: "Court Filing" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "OTHER", label: "Other" },
];

export default function ClientDocumentsPage() {
  const { isAuthenticated } = useAuth();
  const { page, setPage } = usePagination();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [documentType, setDocumentType] = useState("EVIDENCE");
  const [recipientId, setRecipientId] = useState("");
  const [caseId, setCaseId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useContext();

  const { data, isLoading } = trpc.document.list.useQuery(
    { page, pageSize: 20 },
    { enabled: isAuthenticated }
  );

  // Populate the "Send To" dropdown with all active lawyers.
  const { data: lawyers, isLoading: lawyersLoading } = trpc.lawyer.getAll.useQuery(
    {},
    { enabled: isAuthenticated }
  );

  // Client's own active cases, so evidence can optionally be tied to one.
  const { data: myCases } = trpc.case.getAll.useQuery(
    { page: 1, pageSize: 50 },
    { enabled: isAuthenticated }
  );

  const getDownloadUrl = trpc.document.getDownloadUrl.useMutation({
    onSuccess: ({ downloadUrl }) => window.open(downloadUrl, "_blank"),
  });

  const { upload, isUploading, progress, status, reset } = useUpload({
    caseId: caseId || undefined,
    onSuccess: () => {
      utils.document.list.invalidate();
      setShowUpload(false);
      setUploadTitle("");
      setUploadDescription("");
      setRecipientId("");
      setCaseId("");
      reset();
    },
  });

  const canUpload = uploadTitle.trim().length > 0 && recipientId.length > 0;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canUpload) return;
    // recipientId is passed through to the upload hook, which forwards
    // it to document.getUploadUrl → stored on the Document row and used
    // to notify + message the chosen lawyer/admin once upload completes.
    await upload(file, uploadTitle, documentType, { recipientId, description: uploadDescription || undefined });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Head><title>Documents — Client Portal · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/client/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Documents</h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} documents</p>
            </div>
            <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? "Cancel Upload" : "+ Send Document to Lawyer"}
            </button>
          </div>

          {/* Upload panel */}
          {showUpload && (
            <div className="card" style={{ marginBottom: 20, borderLeft: "3px solid var(--color-gold)" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 4 }}>Send Evidence or Document</h3>
              <p style={{ color: "var(--color-light)", fontSize: "0.8rem", marginBottom: 14 }}>
                Upload a file and choose who should receive it. They'll be notified immediately.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Recipient — required */}
                <div className="form-group">
                  <label className="form-label">Send To *</label>
                  <select
                    className="form-select"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    disabled={lawyersLoading}
                  >
                    <option value="">— Select a recipient —</option>
                    {lawyers?.map((l: any) => (
                      <option key={l.userId} value={l.userId}>
                        {l.user.firstName} {l.user.lastName} — {l.title ?? l.position}
                      </option>
                    ))}
                  </select>
                  {!recipientId && (
                    <span style={{ fontSize: "0.72rem", color: "var(--color-light)" }}>
                      Required — choose which lawyer should review this document.
                    </span>
                  )}
                </div>

                {/* Optional case link */}
                {myCases?.cases && myCases.cases.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Related Case (optional)</label>
                    <select className="form-select" value={caseId} onChange={(e) => setCaseId(e.target.value)}>
                      <option value="">— Not linked to a specific case —</option>
                      {myCases.cases.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input className="form-input" placeholder="e.g. Affidavit of Evidence — Jan 2025"
                    value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select className="form-select" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Note to Recipient (optional)</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 70 }}
                    placeholder="Add any context the lawyer should know about this document..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                  />
                </div>

                <div
                  onClick={() => canUpload && fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${canUpload ? "var(--color-gold)" : "var(--color-border)"}`, borderRadius: "var(--radius-md)", padding: "2rem", textAlign: "center", cursor: canUpload ? "pointer" : "not-allowed", background: "var(--color-cream)", transition: "all 0.2s" }}>
                  {isUploading ? (
                    <div>
                      <div style={{ height: 6, background: "var(--color-border)", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "var(--color-gold)", width: `${progress}%`, transition: "width 0.3s", borderRadius: 3 }}></div>
                      </div>
                      <p style={{ color: "var(--color-mid)", fontSize: "0.85rem" }}>Uploading... {progress}%</p>
                    </div>
                  ) : status === "success" ? (
                    <p style={{ color: "#2e7d32", fontSize: "0.9rem" }}>✅ Document sent successfully!</p>
                  ) : (
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                      <p style={{ color: canUpload ? "var(--color-mid)" : "var(--color-light)", fontSize: "0.9rem", margin: 0 }}>
                        {canUpload
                          ? "Click to select a file (PDF, DOCX, XLSX, JPG, PNG — max 50MB)"
                          : "Select a recipient and enter a title first"}
                      </p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleFileSelect} />
                </div>
              </div>
            </div>
          )}

          {/* Documents grid */}
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
          ) : data?.documents?.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
              <p style={{ fontFamily: "var(--font-serif)", color: "var(--color-mid)", fontSize: "1.1rem" }}>No documents yet.</p>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem" }}>Documents you send, or that your lawyers share with you, will appear here.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {data?.documents?.map((doc: any) => (
                  <div key={doc.id} className="card" style={{ cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-gold)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ fontSize: 36, flexShrink: 0 }}>{DOC_ICONS[doc.mimeType] ?? "📄"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", color: "var(--color-dark)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                          <span className="badge badge-neutral" style={{ fontSize: "0.6rem" }}>{doc.type}</span>
                          <span style={{ color: "var(--color-light)", fontSize: "0.7rem" }}>{formatSize(doc.fileSize)}</span>
                        </div>
                        {doc.recipient && (
                          <div style={{ color: "var(--color-gold)", fontSize: "0.7rem", marginTop: 4 }}>
                            Sent to: {doc.recipient.firstName} {doc.recipient.lastName}
                          </div>
                        )}
                        {doc.case && (
                          <div style={{ color: "var(--color-gold)", fontSize: "0.7rem", marginTop: 4 }}>Case: {doc.case.caseNumber}</div>
                        )}
                        <div style={{ color: "var(--color-light)", fontSize: "0.7rem", marginTop: 3 }}>
                          {new Date(doc.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-outline"
                      style={{ width: "100%", marginTop: 14, fontSize: "0.78rem" }}
                      onClick={() => getDownloadUrl.mutate({ documentId: doc.id })}
                      disabled={getDownloadUrl.isLoading}>
                      ⬇ Download
                    </button>
                  </div>
                ))}
              </div>

              {data && data.totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                  <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
                  <span style={{ color: "var(--color-mid)", fontSize: "0.85rem", display: "flex", alignItems: "center" }}>Page {page} of {data.totalPages}</span>
                  <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

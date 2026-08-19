// pages/lawyer/publications/index.tsx
// ── Lawyer publications — create, edit, publish articles

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { generateSlug } from "@/utils/validation.utils";

export default function LawyerPublicationsPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useContext();
  const [showForm, setShowForm] = useState(false);
  type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

    const [form, setForm] = useState<{
      title: string;
      excerpt: string;
      content: string;
      category: string;
      tags: string;
      slug: string;
      status: PublicationStatus;
    }>({
      title: "",
      excerpt: "",
      content: "",
      category: "",
      tags: "",
      slug: "",
      status: "DRAFT",
});
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const { data } = trpc.publication.getAll.useQuery(
    { page: 1, pageSize: 20, status: undefined },
    { enabled: isAuthenticated }
  );

  const create = trpc.publication.create.useMutation({
    onSuccess: () => { utils.publication.getAll.invalidate(); setShowForm(false); setForm({ title: "", excerpt: "", content: "", category: "", tags: "", slug: "", status: "DRAFT" }); showToast("Publication saved!"); },
    onError: (err) => showToast(`Error: ${err.message}`),
  });

  const updatePub = trpc.publication.update.useMutation({
    onSuccess: () => { utils.publication.getAll.invalidate(); showToast("Publication updated!"); },
  });

  const CATEGORIES = ["Constitutional Law", "Corporate Law", "Criminal Law", "Energy Law", "Property Law", "Labour Law", "Family Law", "Tax Law", "ADR", "International Law", "Legal Commentary"];

  const statusStyle: Record<string, { bg: string; color: string }> = {
    DRAFT:     { bg: "#f5f5f5",  color: "#757575" },
    PUBLISHED: { bg: "#e8f5e9",  color: "#2e7d32" },
    ARCHIVED:  { bg: "#fce4ec",  color: "#c62828" },
  };

  return (
    <>
      <Head><title>Publications — Lawyer Portal · D.D. Onietan & Co.</title></Head>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--color-dark)", color: "white", padding: "0.875rem 1.25rem", borderRadius: "var(--radius-md)", fontSize: "0.85rem", zIndex: 9999, borderLeft: "4px solid var(--color-gold)" }}>
          {toast}
        </div>
      )}

      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Publications</h1>
            </div>
            <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ New Article"}
            </button>
          </div>

          {/* Create form */}
          {showForm && (
            <div className="card" style={{ marginBottom: 20, borderTop: "3px solid var(--color-gold)" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", marginBottom: 16 }}>New Publication</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Title *</label>
                    <input className="form-input" placeholder="Publication title" value={form.title}
                      onChange={(e) => setForm(p => ({ ...p, title: e.target.value, slug: generateSlug(e.target.value) }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}>
                      <option value="">Select category...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input className="form-input" placeholder="e.g. nigeria, supreme-court, 2025" value={form.tags} onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">URL Slug *</label>
                    <input className="form-input" placeholder="auto-generated-from-title" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Excerpt / Summary</label>
                    <textarea className="form-textarea" style={{ minHeight: 80 }} placeholder="Brief summary shown on publications list page..." value={form.excerpt} onChange={(e) => setForm(p => ({ ...p, excerpt: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label">Full Content *</label>
                    <textarea className="form-textarea" style={{ minHeight: 240 }} placeholder="Write your full article content here. Markdown supported." value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            status: e.target.value as PublicationStatus,
                          }))
                        }
                      >
                      <option value={"DRAFT"}>Save as Draft</option>
                      <option value={"PUBLISHED"}>Publish Now</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" style={{ fontSize: "0.82rem" }}
                    disabled={!form.title || !form.category || !form.content || !form.slug || create.isLoading}
                    onClick={() => create.mutate({ title: form.title, excerpt: form.excerpt || undefined, content: form.content, category: form.category, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), slug: form.slug, status: form.status })}>
                    {create.isLoading ? "Saving..." : form.status === "PUBLISHED" ? "Publish Article" : "Save Draft"}
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Publications list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data?.publications?.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
                <p style={{ fontFamily: "var(--font-serif)", color: "var(--color-mid)", fontSize: "1.05rem" }}>No publications yet.</p>
                <p style={{ color: "var(--color-light)", fontSize: "0.85rem" }}>Share your legal insights with clients and the public.</p>
              </div>
            ) : (
              data?.publications?.map((pub) => {
                const sb = statusStyle[pub.status] ?? { bg: "#f5f5f5", color: "#555" };
                return (
                  <div key={pub.id} className="card" style={{ borderLeft: "4px solid var(--color-gold)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                          <span className="badge badge-gold" style={{ fontSize: "0.6rem" }}>{pub.category}</span>
                          <span className="badge" style={{ background: sb.bg, color: sb.color, fontSize: "0.6rem" }}>{pub.status}</span>
                          {pub.viewCount > 0 && <span style={{ color: "var(--color-light)", fontSize: "0.72rem" }}>👁 {pub.viewCount} views</span>}
                        </div>
                        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "var(--color-dark)", margin: "0 0 6px" }}>{pub.title}</h3>
                        {pub.excerpt && <p style={{ color: "var(--color-light)", fontSize: "0.8rem", margin: "0 0 8px", lineHeight: 1.5 }}>{pub.excerpt.substring(0, 120)}...</p>}
                        <div style={{ color: "var(--color-light)", fontSize: "0.72rem" }}>
                          {pub.publishedAt ? `Published: ${new Date(pub.publishedAt).toLocaleDateString("en-NG")}` : `Created: ${new Date(pub.createdAt).toLocaleDateString("en-NG")}`}
                          {pub.tags?.length > 0 && <span style={{ marginLeft: 12 }}>🏷 {pub.tags.join(", ")}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        {pub.status === "DRAFT" && (
                          <button className="btn btn-primary" style={{ fontSize: "0.72rem", padding: "0.35rem 0.875rem" }}
                            onClick={() => updatePub.mutate({ id: pub.id, status: "PUBLISHED" })}>
                            Publish
                          </button>
                        )}
                        {pub.status === "PUBLISHED" && (
                          <button className="btn btn-ghost" style={{ fontSize: "0.72rem", padding: "0.35rem 0.875rem", color: "#c62828" }}
                            onClick={() => updatePub.mutate({ id: pub.id, status: "ARCHIVED" })}>
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

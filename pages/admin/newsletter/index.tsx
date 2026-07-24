// pages/admin/newsletter/index.tsx
// ── Admin: newsletter subscriber management

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePagination, useDebounce } from "@/hooks/index";

export default function AdminNewsletterPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination(1, 50);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = trpc.public.getSubscribers.useQuery(
    { page, pageSize },
    { enabled: isAuthenticated }
  );

  const filtered = data?.subscribers?.filter(
    (s) =>
      !debouncedSearch ||
      s.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!data?.subscribers) return;
    const csv = [
      "Full Name,Email,Subscribed Date,Source",
      ...data.subscribers.map(
        (s) =>
          `"${s.fullName}","${s.email}","${new Date(s.subscribedAt).toLocaleDateString("en-NG")}","${s.source}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Head><title>Newsletter — Admin · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Newsletter Subscribers</h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} active subscribers</p>
            </div>
            <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={handleExportCSV}>
              ⬇ Export CSV
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Subscribers", value: data?.total ?? 0, icon: "📧" },
              { label: "This Month", value: data?.subscribers?.filter(s => new Date(s.subscribedAt) >= new Date(new Date().setDate(1))).length ?? 0, icon: "📅" },
              { label: "From Website", value: data?.subscribers?.filter(s => s.source === "website").length ?? 0, icon: "🌐" },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: "center", borderTop: "3px solid var(--color-gold)", padding: "1.25rem" }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: "bold", color: "var(--color-dark)", margin: "4px 0" }}>{s.value}</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="card" style={{ marginBottom: 16, padding: "0.875rem 1.25rem" }}>
            <input className="form-input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Source</th><th>Subscribed</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filtered?.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No subscribers found.</td></tr>
                    ) : filtered?.map((sub, idx) => (
                      <tr key={sub.id}>
                        <td style={{ color: "var(--color-light)", fontSize: "0.78rem" }}>{(page - 1) * pageSize + idx + 1}</td>
                        <td style={{ fontWeight: 500 }}>{sub.fullName}</td>
                        <td style={{ color: "var(--color-gold)", fontSize: "0.85rem" }}>{sub.email}</td>
                        <td><span className="badge badge-neutral" style={{ fontSize: "0.62rem" }}>{sub.source}</span></td>
                        <td style={{ fontSize: "0.78rem", color: "var(--color-light)" }}>{new Date(sub.subscribedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td><span className="badge badge-success" style={{ fontSize: "0.62rem" }}>Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18 }}>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span style={{ color: "var(--color-mid)", fontSize: "0.85rem" }}>Page {page} of {data.totalPages}</span>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

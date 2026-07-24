// pages/lawyer/clients/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useDebounce, usePagination } from "@/hooks/index";

export default function LawyerClientsPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination();
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 350);
  const { data, isLoading } = trpc.client.listAll.useQuery({ page, pageSize, search: dSearch || undefined }, { enabled: isAuthenticated });
  return (
    <>
      <Head><title>Clients — Lawyer Portal</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Clients</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} clients</p>
          </div>
          <div className="card" style={{ marginBottom: 16, padding: "0.875rem 1.25rem" }}>
            <input className="form-input" placeholder="Search clients by name, email, company..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Client</th><th>Company</th><th>Contact</th><th>Cases</th><th>Client No.</th></tr></thead>
                  <tbody>
                    {data?.clients?.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No clients found.</td></tr>
                    ) : data?.clients?.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.user.firstName} {c.user.lastName}</div>
                          <div style={{ color: "var(--color-light)", fontSize: "0.75rem" }}>{c.user.email}</div>
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>{c.companyName ?? "—"}</td>
                        <td style={{ fontSize: "0.82rem", color: "var(--color-mid)" }}>{c.user.phone ?? "—"}</td>
                        <td><span style={{ background: "rgba(201,168,76,0.12)", color: "#8B7536", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c._count?.cases ?? 0}</span></td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--color-gold)" }}>{c.clientNumber}</td>
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

// pages/admin/invoices/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePagination } from "@/hooks/index";

export default function AdminInvoicesPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useContext();
  const { page, pageSize, setPage } = usePagination();
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const { data, isLoading } = trpc.invoice.list.useQuery({ page, pageSize, status: statusFilter || undefined }, { enabled: isAuthenticated });
  const markPaid = trpc.invoice.markPaid.useMutation({ onSuccess: () => utils.invoice.list.invalidate() });
  const sendInvoice = trpc.invoice.send.useMutation({ onSuccess: () => utils.invoice.list.invalidate() });
  const fmt = (v: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(v);
  const statusStyle: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: "#f5f5f5", color: "#757575" }, SENT: { bg: "#e3f2fd", color: "#1565c0" },
    PAID: { bg: "#e8f5e9", color: "#2e7d32" }, OVERDUE: { bg: "#fce4ec", color: "#c62828" }, CANCELLED: { bg: "#f5f5f5", color: "#9e9e9e" },
  };
  const totalRevenue = data?.invoices?.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.totalAmount), 0) ?? 0;
  const totalPending = data?.invoices?.filter(i => i.status === "SENT" || i.status === "OVERDUE").reduce((s, i) => s + Number(i.totalAmount) - Number(i.paidAmount), 0) ?? 0;
  return (
    <>
      <Head><title>Invoices — Admin</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Invoices</h1>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
            {[{ l: "Total Invoices", v: data?.total ?? 0, i: "📄" }, { l: "Revenue Collected", v: fmt(totalRevenue), i: "✅" }, { l: "Outstanding", v: fmt(totalPending), i: "⏳" }].map(s => (
              <div key={s.l} className="card" style={{ textAlign: "center", borderTop: "3px solid var(--color-gold)", padding: "1.25rem" }}>
                <div style={{ fontSize: 24 }}>{s.i}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: "bold", color: "var(--color-dark)", margin: "4px 0" }}>{s.v}</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: 14, padding: "0.875rem 1.25rem" }}>
            <div style={{ display: "flex", gap: 10 }}>
              {["", ...["DRAFT","SENT","PAID","OVERDUE","CANCELLED"]].map(s => (
                <button key={s} onClick={() => setStatusFilter(s as string | "")} className="btn"
                  style={{ fontSize: "0.75rem", padding: "0.4rem 0.875rem", background: statusFilter === s ? "var(--color-dark)" : "white", color: statusFilter === s ? "var(--color-gold)" : "var(--color-mid)", border: `1px solid ${statusFilter === s ? "var(--color-dark)" : "var(--color-border)"}` }}>
                  {s === "" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div> : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Invoice #</th><th>Client</th><th>Case</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data?.invoices?.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No invoices.</td></tr>
                      : data?.invoices?.map(inv => {
                        const sb = statusStyle[inv.status] ?? { bg: "#f5f5f5", color: "#555" };
                        return (
                          <tr key={inv.id}>
                            <td style={{ color: "var(--color-gold)", fontWeight: 600, fontFamily: "monospace", fontSize: "0.82rem" }}>{inv.invoiceNumber}</td>
                            <td style={{ fontSize: "0.85rem" }}>{inv.client.user.firstName} {inv.client.user.lastName}</td>
                            <td style={{ color: "var(--color-light)", fontSize: "0.8rem" }}>{inv.case?.caseNumber ?? "General"}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(Number(inv.totalAmount))}</td>
                            <td style={{ fontSize: "0.8rem", color: new Date(inv.dueDate) < new Date() && inv.status !== "PAID" ? "#c62828" : "var(--color-mid)" }}>{new Date(inv.dueDate).toLocaleDateString("en-NG")}</td>
                            <td><span style={{ background: sb.bg, color: sb.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{inv.status}</span></td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                {inv.status === "DRAFT" && <button className="btn btn-primary" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem" }} onClick={() => sendInvoice.mutate({ id: inv.id })}>Send</button>}
                                {(inv.status === "SENT" || inv.status === "OVERDUE") && <button className="btn btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem", color: "#2e7d32" }} onClick={() => markPaid.mutate({ id: inv.id, paidAmount: Number(inv.totalAmount) })}>Mark Paid</button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

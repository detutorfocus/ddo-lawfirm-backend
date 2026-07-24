// pages/client/invoices.tsx
// ── Client invoices — view, download

import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const statusStyle: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: "#f5f5f5",  color: "#757575" },
  SENT:      { bg: "#e3f2fd",  color: "#1565c0" },
  PAID:      { bg: "#e8f5e9",  color: "#2e7d32" },
  OVERDUE:   { bg: "#fce4ec",  color: "#c62828" },
  CANCELLED: { bg: "#f5f5f5",  color: "#9e9e9e" },
};

export default function ClientInvoicesPage() {
  const { isAuthenticated } = useAuth();
  const { data } = trpc.invoice.list.useQuery({ page: 1, pageSize: 20 }, { enabled: isAuthenticated });

  const formatAmount = (amount: number | string) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(Number(amount));

  const totalPending = data?.invoices?.filter(i => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.totalAmount) - Number(i.paidAmount), 0) ?? 0;

  return (
    <>
      <Head><title>Invoices — Client Portal · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/client/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Invoices</h1>
          </div>

          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Invoices", value: data?.total ?? 0, icon: "📄" },
              { label: "Amount Outstanding", value: formatAmount(totalPending), icon: "💰" },
              { label: "Paid Invoices", value: data?.invoices?.filter(i => i.status === "PAID").length ?? 0, icon: "✅" },
              { label: "Overdue", value: data?.invoices?.filter(i => i.status === "OVERDUE").length ?? 0, icon: "⚠️" },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: "center", borderTop: "3px solid var(--color-gold)", padding: "1.25rem" }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: "bold", color: "var(--color-dark)", margin: "4px 0" }}>{s.value}</div>
                <div style={{ color: "var(--color-light)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bank details notice */}
          <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "var(--radius-md)", padding: "0.875rem 1.25rem", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🏦</span>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", color: "var(--color-dark)", marginBottom: 3 }}>Payment Instructions</div>
              <p style={{ color: "var(--color-mid)", fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
                Please make payment via bank transfer. Account details: <strong>D.D. Onietan & Co.</strong> · Access Bank · Account No: 0123456789.
                Quote your invoice number as the payment reference. Contact us after payment to confirm receipt.
              </p>
            </div>
          </div>

          {/* Invoices list */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Matter</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.invoices?.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--color-light)", padding: "2rem" }}>No invoices found.</td></tr>
                  ) : (
                    data?.invoices?.map((inv) => {
                      const sb = statusStyle[inv.status] ?? { bg: "#f5f5f5", color: "#555" };
                      const isOverdue = inv.status === "SENT" && new Date(inv.dueDate) < new Date();
                      return (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 600, color: "var(--color-gold)", fontFamily: "var(--font-serif)" }}>{inv.invoiceNumber}</td>
                          <td style={{ fontSize: "0.82rem" }}>{inv.case?.caseNumber ?? "General"}</td>
                          <td style={{ fontSize: "0.82rem", color: "var(--color-mid)", whiteSpace: "nowrap" }}>{new Date(inv.issueDate).toLocaleDateString("en-NG")}</td>
                          <td style={{ fontSize: "0.82rem", color: isOverdue ? "#c62828" : "var(--color-mid)", whiteSpace: "nowrap", fontWeight: isOverdue ? 700 : 400 }}>
                            {new Date(inv.dueDate).toLocaleDateString("en-NG")}
                            {isOverdue && " ⚠️"}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatAmount(inv.totalAmount)}</td>
                          <td style={{ color: Number(inv.paidAmount) > 0 ? "#2e7d32" : "var(--color-light)" }}>
                            {Number(inv.paidAmount) > 0 ? formatAmount(inv.paidAmount) : "—"}
                          </td>
                          <td>
                            <span className="badge" style={{ background: isOverdue ? "#fce4ec" : sb.bg, color: isOverdue ? "#c62828" : sb.color, fontSize: "0.62rem" }}>
                              {isOverdue ? "OVERDUE" : inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

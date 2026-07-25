// pages/admin/audit-logs/index.tsx
// ── Admin: security audit log viewer with filters

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { usePagination, useDebounce } from "@/hooks/index";
//import { AuditAction } from "@/types/index";
import { AUDIT_ACTIONS, type AuditActionType } from "@/types/index";
const { isAuthenticated } = useAuth();
const { page, pageSize, setPage } = usePagination(1, 50);
const [actionFilter, setActionFilter] = useState<AuditActionType | "">("");
<select className="form-select" style={{ minWidth: 160 }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value as AuditActionType | ""); setPage(1); }}>
   <option value="">All Actions</option>
    {Object.values(AUDIT_ACTIONS).map(a => <option key={a} value={a}>{a}</option>)}
</select>
const actionColor: Record<string, string> = {
  LOGIN: "#1565c0", LOGOUT: "#757575", CREATE: "#2e7d32", READ: "#546e7a",
  UPDATE: "#e65100", DELETE: "#c62828", FILE_UPLOAD: "#6a1b9a",
  FILE_DOWNLOAD: "#00695c", PERMISSION_CHANGE: "#ad1457",
};

export default function AuditLogsPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination(1, 50);
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");
  const [resource, setResource] = useState("");
  const debouncedResource = useDebounce(resource, 300);

  const { data, isLoading } = trpc.admin.getAuditLogs.useQuery(
    { page, pageSize, action: actionFilter || undefined, resource: debouncedResource || undefined },
    { enabled: isAuthenticated }
  );

  return (
    <>
      <Head><title>Audit Logs — Admin · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Audit Logs</h1>
            <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} total entries · Security & compliance trail</p>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: 18, padding: "0.875rem 1.25rem" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <select className="form-select" style={{ minWidth: 160 }} value={actionFilter} onChange={(e) => { setActionFilter(e.target.value as AuditAction | ""); setPage(1); }}>
                <option value="">All Actions</option>
                {Object.values(AuditAction).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <input className="form-input" style={{ flex: 1, minWidth: 160 }} placeholder="Filter by resource (e.g. Case, Document, User)..." value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }} />
              {(actionFilter || resource) && <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} onClick={() => { setActionFilter(""); setResource(""); }}>Clear</button>}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>IP Address</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data?.logs?.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: "0.75rem", color: "var(--color-light)", whiteSpace: "nowrap" }}>
                          {new Date(log.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td>
                          {log.user ? (
                            <div>
                              <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{log.user.firstName} {log.user.lastName}</div>
                              <div style={{ color: "var(--color-light)", fontSize: "0.72rem" }}>{log.user.role}</div>
                            </div>
                          ) : <span style={{ color: "var(--color-light)", fontSize: "0.82rem" }}>System</span>}
                        </td>
                        <td>
                          <span className="badge" style={{ background: `${actionColor[log.action] ?? "#555"}18`, color: actionColor[log.action] ?? "#555", fontSize: "0.62rem", fontWeight: 700 }}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{log.resource}</div>
                          {log.resourceId && <div style={{ color: "var(--color-light)", fontSize: "0.68rem", fontFamily: "monospace" }}>{log.resourceId.substring(0, 16)}...</div>}
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "var(--color-light)", fontFamily: "monospace" }}>{log.ipAddress ?? "—"}</td>
                        <td>
                          <span className="badge" style={{ background: log.success ? "#e8f5e9" : "#fce4ec", color: log.success ? "#2e7d32" : "#c62828", fontSize: "0.62rem" }}>
                            {log.success ? "Success" : "Failed"}
                          </span>
                        </td>
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
              <span style={{ color: "var(--color-mid)", fontSize: "0.85rem" }}>Page {page} of {data.totalPages} · {data.total} entries</span>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

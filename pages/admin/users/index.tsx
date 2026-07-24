// pages/admin/users/index.tsx
// ── Admin users list — search, filter by role, toggle status

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useDebounce, usePagination } from "@/hooks/index";

export default function AdminUsersPage() {
  const { isAuthenticated } = useAuth();
  const { page, pageSize, setPage } = usePagination(1, 25);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | "">("");
  const debouncedSearch = useDebounce(search, 350);
  const utils = trpc.useContext();

  const { data, isLoading } = trpc.admin.getUsers.useQuery(
    { page, pageSize, role: roleFilter || undefined, search: debouncedSearch || undefined },
    { enabled: isAuthenticated }
  );

  const toggleStatus = trpc.admin.toggleUserStatus.useMutation({
    onSuccess: () => utils.admin.getUsers.invalidate(),
  });

  const roleColors: Record<UserRole, { bg: string; color: string }> = {
    ADMIN: { bg: "#f3e5f5", color: "#6a1b9a" },
    LAWYER: { bg: "rgba(201,168,76,0.12)", color: "#8B7536" },
    CLIENT: { bg: "#e3f2fd", color: "#1565c0" },
  };

  return (
    <>
      <Head><title>Users — Admin · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/admin/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Admin Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>User Management</h1>
              <p style={{ color: "var(--color-light)", fontSize: "0.85rem", margin: 0 }}>{data?.total ?? 0} users</p>
            </div>
            <Link href="/admin/lawyers/new">
              <button className="btn btn-primary" style={{ fontSize: "0.82rem" }}>+ Create Lawyer Account</button>
            </Link>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: 18, padding: "0.875rem 1.25rem" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <select className="form-select" style={{ minWidth: 140 }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as string | ""); setPage(1); }}>
                <option value="">All Roles</option>
                {["ADMIN","LAWYER","CLIENT"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {(search || roleFilter) && <button className="btn btn-ghost" style={{ fontSize: "0.8rem" }} onClick={() => { setSearch(""); setRoleFilter(""); }}>Clear</button>}
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {isLoading ? (
              <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }}></div></div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Details</th>
                      <th>Verified</th>
                      <th>2FA</th>
                      <th>Last Login</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.users?.map((u) => {
                      const rb = roleColors[u.role];
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gold)", fontSize: 12, fontWeight: "bold", flexShrink: 0 }}>
                                {u.firstName[0]}{u.lastName[0]}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.firstName} {u.lastName}</div>
                                <div style={{ color: "var(--color-light)", fontSize: "0.75rem" }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge" style={{ background: rb.bg, color: rb.color, fontSize: "0.65rem" }}>{u.role}</span></td>
                          <td style={{ fontSize: "0.78rem", color: "var(--color-mid)" }}>
                            {u.lawyer && <div>⚖️ {u.lawyer.position}</div>}
                            {u.client && <div>👤 {u.client.clientNumber}</div>}
                            {u.client?.companyName && <div style={{ color: "var(--color-light)" }}>{u.client.companyName}</div>}
                          </td>
                          <td>
                            <span style={{ fontSize: 16 }}>{u.isEmailVerified ? "✅" : "❌"}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: 16 }}>{u.twoFactorEnabled ? "🔐" : "—"}</span>
                          </td>
                          <td style={{ fontSize: "0.75rem", color: "var(--color-light)", whiteSpace: "nowrap" }}>
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-NG") : "Never"}
                          </td>
                          <td>
                            <span className="badge" style={{ background: u.isActive ? "#e8f5e9" : "#fce4ec", color: u.isActive ? "#2e7d32" : "#c62828", fontSize: "0.65rem" }}>
                              {u.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem", color: u.isActive ? "#c62828" : "#2e7d32", borderColor: u.isActive ? "#f48fb1" : "#a5d6a7" }}
                              onClick={() => toggleStatus.mutate({ userId: u.id, isActive: !u.isActive })}
                              disabled={toggleStatus.isLoading}
                            >
                              {u.isActive ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
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

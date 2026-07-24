// src/components/QueryState.tsx
// ── Reusable loading / error / empty wrapper for tRPC queries.
//
// Problem this solves: pages previously only checked `isLoading` and
// assumed success. If the DB connection failed, tRPC's `isError` would
// be true but no page rendered anything for it — the spinner or blank
// content just sat there with no explanation, looking like a frozen app.
//
// Usage:
//   <QueryState isLoading={isLoading} isError={isError} error={error}>
//     {tasks.map(...)}
//   </QueryState>

import { type ReactNode } from "react";

interface QueryStateProps {
  isLoading: boolean;
  isError?: boolean;
  error?: { message?: string } | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  children: ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyMessage = "No data found.",
  emptyIcon = "📭",
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", gap: 12 }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: "var(--color-light)", fontSize: "0.85rem", fontFamily: "var(--font-sans)" }}>Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "2.5rem 1.5rem", gap: 10, textAlign: "center",
        background: "#fce4ec", border: "1px solid #f48fb1", borderRadius: "var(--radius-md)",
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <p style={{ color: "#c62828", fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0, fontWeight: 600 }}>
          Couldn't load this data
        </p>
        <p style={{ color: "#8a4a4a", fontSize: "0.82rem", fontFamily: "var(--font-sans)", maxWidth: 420, margin: 0 }}>
          {error?.message || "The server didn't respond. This usually means the database isn't connected — check DATABASE_URL in .env.local."}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: "0.5rem 1.25rem", background: "#c62828", color: "white",
            border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600,
            cursor: "pointer", fontFamily: "var(--font-sans)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{emptyIcon}</div>
        <p style={{ color: "var(--color-light)", fontFamily: "var(--font-serif)", fontSize: "1rem" }}>{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}

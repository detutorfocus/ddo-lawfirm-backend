// pages/lawyer/messages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function LawyerMessagesPage() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { data: inbox } = trpc.message.getInbox.useQuery({ page: 1, pageSize: 30 }, { enabled: isAuthenticated });
  const { data: thread } = trpc.message.getThread.useQuery({ messageId: selectedId! }, { enabled: !!selectedId });
  const send = trpc.message.send.useMutation({ onSuccess: () => { utils.message.getInbox.invalidate(); setReplyContent(""); }});

  return (
    <>
      <Head><title>Messages — Lawyer Portal</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <Link href="/lawyer/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>Messages {inbox?.unread > 0 && <span style={{ background: "#fce4ec", color: "#c62828", padding: "2px 8px", borderRadius: 20, fontSize: 13, marginLeft: 8 }}>{inbox.unread} new</span>}</h1>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 1.4fr" : "1fr", gap: 20 }}>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)", fontFamily: "var(--font-serif)", fontSize: "1rem" }}>Inbox</div>
              {inbox?.messages?.length === 0 ? (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-light)" }}>No messages.</div>
              ) : inbox?.messages?.map(msg => (
                <div key={msg.id} onClick={() => setSelectedId(msg.id === selectedId ? null : msg.id)}
                  style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-border)", cursor: "pointer", background: selectedId === msg.id ? "rgba(201,168,76,0.06)" : "white", borderLeft: selectedId === msg.id ? "3px solid var(--color-gold)" : "3px solid transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: msg.status === "SENT" ? 700 : 500, fontSize: "0.875rem", color: "var(--color-dark)" }}>{msg.sender.firstName} {msg.sender.lastName}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-light)" }}>{new Date(msg.createdAt).toLocaleDateString("en-NG")}</div>
                  </div>
                  {msg.subject && <div style={{ fontSize: "0.82rem", color: "var(--color-dark)", marginTop: 2 }}>{msg.subject}</div>}
                  <div style={{ fontSize: "0.75rem", color: "var(--color-light)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.content.substring(0, 80)}</div>
                </div>
              ))}
            </div>
            {selectedId && thread && (
              <div className="card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>{thread.subject ?? "Message"}</h3>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", maxHeight: 380, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[thread, ...(thread.replies ?? [])].map(msg => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "80%", background: isMine ? "#1A1A1A" : "var(--color-cream)", borderRadius: 8, padding: "0.75rem 1rem", border: isMine ? "none" : "1px solid var(--color-border)" }}>
                          <div style={{ fontSize: "0.7rem", color: isMine ? "var(--color-gold)" : "var(--color-light)", marginBottom: 4 }}>{msg.sender.firstName} {msg.sender.lastName}</div>
                          <p style={{ fontSize: "0.875rem", color: isMine ? "#e0d5c5" : "var(--color-dark)", lineHeight: 1.65, margin: 0 }}>{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.25rem" }}>
                  <textarea className="form-textarea" style={{ minHeight: 80, marginBottom: 10 }} placeholder="Write a reply..." value={replyContent} onChange={e => setReplyContent(e.target.value)} />
                  <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} disabled={!replyContent.trim() || send.isLoading}
                    onClick={() => send.mutate({ receiverId: thread.senderId, content: replyContent, parentId: thread.id })}>
                    {send.isLoading ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// pages/client/messages.tsx
// ── Secure client messaging — inbox, thread view, send reply

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function ClientMessagesPage() {
  const { isAuthenticated, user } = useAuth();
  const utils = trpc.useContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [newMsg, setNewMsg] = useState({ receiverId: "", subject: "", content: "" });
  const [showCompose, setShowCompose] = useState(false);

  const { data: inbox } = trpc.message.getInbox.useQuery(
    { page: 1, pageSize: 30 },
    { enabled: isAuthenticated }
  );
  const { data: thread } = trpc.message.getThread.useQuery(
    { messageId: selectedId! },
    { enabled: !!selectedId }
  );
  const { data: lawyers } = trpc.lawyer.getAll.useQuery({}, { enabled: isAuthenticated });

  const send = trpc.message.send.useMutation({
    onSuccess: () => { utils.message.getInbox.invalidate(); setReplyContent(""); setNewMsg({ receiverId: "", subject: "", content: "" }); setShowCompose(false); },
  });

  const initials = (first: string, last: string) => `${first[0]}${last[0]}`.toUpperCase();

  return (
    <>
      <Head><title>Messages — Client Portal · D.D. Onietan & Co.</title></Head>
      <div style={{ minHeight: "100vh", background: "var(--color-cream)", padding: "2rem", fontFamily: "var(--font-sans)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/client/dashboard"><span style={{ color: "var(--color-gold)", fontSize: "0.8rem" }}>← Dashboard</span></Link>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", margin: "4px 0 0" }}>
                Messages {inbox?.unread > 0 && <span className="badge badge-danger" style={{ fontSize: "0.65rem", marginLeft: 8 }}>{inbox.unread} new</span>}
              </h1>
            </div>
            <button className="btn btn-primary" style={{ fontSize: "0.82rem" }} onClick={() => setShowCompose(!showCompose)}>
              {showCompose ? "Cancel" : "✏ Compose"}
            </button>
          </div>

          {/* Compose */}
          {showCompose && (
            <div className="card" style={{ marginBottom: 20, borderTop: "3px solid var(--color-gold)" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", marginBottom: 14 }}>New Message</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Send To</label>
                  <select className="form-select" value={newMsg.receiverId} onChange={(e) => setNewMsg(p => ({ ...p, receiverId: e.target.value }))}>
                    <option value="">Select a lawyer...</option>
                    {lawyers?.map(l => (
                      <option key={l.user.email} value={l.userId}>{l.user.firstName} {l.user.lastName} — {l.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" placeholder="Message subject" value={newMsg.subject} onChange={(e) => setNewMsg(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" style={{ minHeight: 120 }} placeholder="Write your message..." value={newMsg.content} onChange={(e) => setNewMsg(p => ({ ...p, content: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" style={{ fontSize: "0.82rem" }}
                    disabled={!newMsg.receiverId || !newMsg.content || send.isLoading}
                    onClick={() => send.mutate({ receiverId: newMsg.receiverId, subject: newMsg.subject || undefined, content: newMsg.content })}>
                    {send.isLoading ? "Sending..." : "Send Message"}
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: "0.82rem" }} onClick={() => setShowCompose(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 1.4fr" : "1fr", gap: 20 }}>
            {/* Inbox */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>Inbox</h3>
                <span style={{ color: "var(--color-light)", fontSize: "0.8rem" }}>{inbox?.messages?.length ?? 0} messages</span>
              </div>
              {inbox?.messages?.length === 0 ? (
                <div style={{ padding: "2.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✉️</div>
                  <p style={{ color: "var(--color-light)", fontFamily: "var(--font-serif)" }}>No messages yet.</p>
                </div>
              ) : (
                inbox?.messages?.map((msg) => {
                  const isSelected = selectedId === msg.id;
                  const isUnread = msg.status === "SENT";
                  return (
                    <div key={msg.id} onClick={() => setSelectedId(isSelected ? null : msg.id)}
                      style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-border)", cursor: "pointer",
                        background: isSelected ? "rgba(201,168,76,0.06)" : isUnread ? "rgba(201,168,76,0.03)" : "white",
                        borderLeft: isSelected ? "3px solid var(--color-gold)" : `3px solid ${isUnread ? "rgba(201,168,76,0.4)" : "transparent"}`,
                        transition: "all 0.15s",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 10, flex: 1 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gold)", fontSize: 13, fontWeight: "bold", flexShrink: 0 }}>
                            {initials(msg.sender.firstName, msg.sender.lastName)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: isUnread ? 700 : 500, fontSize: "0.875rem", color: "var(--color-dark)" }}>
                                {msg.sender.firstName} {msg.sender.lastName}
                              </span>
                              {isUnread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-gold)", flexShrink: 0 }}></span>}
                            </div>
                            {msg.subject && <div style={{ fontSize: "0.82rem", color: "var(--color-dark)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.subject}</div>}
                            <div style={{ fontSize: "0.75rem", color: "var(--color-light)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {msg.content.substring(0, 80)}{msg.content.length > 80 ? "..." : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ color: "var(--color-light)", fontSize: "0.68rem", marginTop: 4, textAlign: "right" }}>
                        {new Date(msg.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        {msg.replies?.length > 0 && <span style={{ marginLeft: 6 }}>💬 {msg.replies.length}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Thread view */}
            {selectedId && thread && (
              <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", margin: 0 }}>{thread.subject ?? "Message Thread"}</h3>
                  <p style={{ color: "var(--color-light)", fontSize: "0.75rem", margin: "3px 0 0" }}>
                    {thread.sender.firstName} {thread.sender.lastName} → {thread.receiver.firstName} {thread.receiver.lastName}
                  </p>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 14, maxHeight: 420 }}>
                  {/* Original message */}
                  {[thread, ...(thread.replies ?? [])].map((msg, i) => {
                    const isMine = msg.sender?.email === user?.email;
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "80%", background: isMine ? "var(--color-dark)" : "var(--color-cream)", borderRadius: isMine ? "var(--radius-md) var(--radius-md) 2px var(--radius-md)" : "var(--radius-md) var(--radius-md) var(--radius-md) 2px", padding: "0.75rem 1rem", border: isMine ? "none" : "1px solid var(--color-border)" }}>
                          <div style={{ fontSize: "0.7rem", color: isMine ? "var(--color-gold)" : "var(--color-light)", marginBottom: 6, fontWeight: 600 }}>
                            {msg.sender.firstName} {msg.sender.lastName}
                          </div>
                          <p style={{ fontSize: "0.875rem", color: isMine ? "#e0d5c5" : "var(--color-dark)", lineHeight: 1.65, margin: 0 }}>{msg.content}</p>
                          <div style={{ fontSize: "0.65rem", color: isMine ? "#666" : "var(--color-light)", marginTop: 5, textAlign: "right" }}>
                            {new Date(msg.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply box */}
                <div style={{ borderTop: "1px solid var(--color-border)", padding: "0.875rem 1.25rem" }}>
                  <textarea className="form-textarea" style={{ minHeight: 80, marginBottom: 10 }}
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)} />
                  <button className="btn btn-primary" style={{ fontSize: "0.82rem" }}
                    disabled={!replyContent.trim() || send.isLoading}
                    onClick={() => send.mutate({ receiverId: thread.sender.email === user?.email ? thread.receiver.id : thread.senderId, content: replyContent, parentId: thread.id })}>
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

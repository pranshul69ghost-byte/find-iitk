import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

export default function Messages() {
  const [chats, setChats] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState<any>(null);
  const loc = useLocation();
  const nav = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { (async()=>{ const { data } = await api.get("/users/me"); setMe(data); await loadChats(); })(); }, []);

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL || "http://localhost:4000");
    s.on("connect", () => s.emit("auth", localStorage.getItem("token")));
    s.on("message:new", (payload: any) => {
      if (active && payload.chatId === active._id) setMessages((m) => m.concat([payload.message]));
      loadChats();
      setTimeout(scrollBottom, 30);
    });
    return () => { s.disconnect(); };
  }, [active?._id]);

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const chatId = params.get("chat");
    if (chatId) openChat(chatId);
  }, [loc.search, chats.length]);

  async function loadChats(){
    const { data } = await api.get("/chats");
    setChats(data);
    if (!active && data[0]) openChat(data[0]._id);
  }
  function otherOf(chat:any){
    if (!me) return null;
    const parts = (chat.participants||[]).map((p:any)=> (p && typeof p === "object" ? p : { _id: p }));
    return parts.find((p:any)=> String(p._id) !== String(me._id)) || null;
  }
  async function openChat(id: string){
    const list = (await api.get("/chats")).data;
    const chat = list.find((c:any)=>c._id===id) || list[0];
    if (!chat) return;
    setChats(list);
    setActive(chat);
    const { data: msgs } = await api.get(`/chats/${id}/messages`);
    setMessages(msgs);
    setTimeout(scrollBottom, 20);
  }
  const sendMutation = useMutation({
    mutationFn: async (body: { text: string; clientId: string }) => {
      return api.post(`/chats/${active._id}/messages`, body);
    },
    onSuccess: ({ data }) => {
      setMessages((m)=>m.concat([data]));
      setText("");
      setTimeout(scrollBottom, 20);
    }
  });

  function send(){
    if (!text.trim() || !active || sendMutation.isPending) return;
    const clientId = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    sendMutation.mutate({ text, clientId });
  }
  function onKey(e: React.KeyboardEvent<HTMLInputElement>){
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }
  function scrollBottom(){ const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }

  // Group messages by day and render date chips
  const groups = useMemo(() => groupByDay(messages), [messages]);

  if (!me) return <div className="empty">Loading…</div>;
  const other = active ? otherOf(active) : null;

  return (
    <div className="chat-fixed">
      <aside className="chat-sidebar">
        <div className="title" style={{ marginBottom: 8 }}>Chats</div>
        <div className="chat-list">
          {chats.map((c) => {
            const o = otherOf(c);
            const cls = active?._id===c._id ? "chat-card active" : "chat-card";
            return (
              <div key={c._id} className={cls} onClick={()=>openChat(c._id)}>
                <div className="chat-card-title">{o?.name || o?.email || "User"}</div>
                <div className="chat-card-sub">{c.listingId?.title || ""}</div>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="chat-pane">
        {!active ? (
          <div className="muted" style={{ padding: 14 }}>Select a chat</div>
        ) : (
          <>
            <header className="chat-header">
              <div>
                <div className="chat-name">{other?.name || other?.email || "User"}</div>
                <div className="chat-sub">{active.listingId?.title || ""}</div>
              </div>
              {other && <button className="btn" onClick={()=>nav(`/user/${other._id}`)}>View profile</button>}
            </header>

            <div className="msg-list" ref={listRef}>
              {groups.map((g) => (
                <div key={g.key} style={{ display:"contents" }}>
                  <div className="date-row"><span className="date-chip">{g.label}</span></div>
                  {g.items.map((m:any) => {
                    const mine = String(m.senderId) === String(me._id);
                    return (
                      <div key={m._id} className={`msg-row ${mine ? "me" : "them"}`}>
                        <div className={`msg-bubble ${mine ? "me" : "them"}`}>
                          <div className="msg-text">{m.text}</div>
                          <div className="msg-time">{formatHM(m.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="input-bar">
              <input placeholder="Type a message…" value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={onKey} disabled={sendMutation.isPending} />
              <button className="btn primary" onClick={send} disabled={sendMutation.isPending} aria-busy={sendMutation.isPending}>
                {sendMutation.isPending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* Helpers */
function startOfDay(d: Date){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function dayDiff(a: Date, b: Date){ return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000); }
function labelFor(date: Date){
  const now = new Date();
  const diff = dayDiff(now, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return date.toLocaleDateString(undefined, { weekday: "long" }); // Mon/Tue
  const opts: Intl.DateTimeFormatOptions = { day:"2-digit", month:"short" };
  const withYear = now.getFullYear() !== date.getFullYear();
  if (withYear) (opts as any).year = "numeric";
  return date.toLocaleDateString(undefined, opts);
}
function groupByDay(items: any[]){
  const out: { key:string; label:string; items:any[] }[] = [];
  for (const m of items){
    const d = new Date(m.createdAt);
    const key = d.toDateString();
    let g = out[out.length-1];
    if (!g || g.key !== key){
      g = { key, label: labelFor(d), items: [] };
      out.push(g);
    }
    g.items.push(m);
  }
  return out;
}
function formatHM(ts: string){ const d = new Date(ts); return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
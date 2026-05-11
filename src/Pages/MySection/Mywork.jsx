/**
 * AssignedTickets.jsx — "My Assigned Tickets" view
 *
 * Shown ONLY to employees who have tickets assigned to them.
 * Role detection is dynamic — reads from /api/v1/auth/me
 *
 * This component:
 *  - Fetches ALL tickets and filters by assigned_to === current_user.id
 *  - Lets the assignee: resolve, add HR-flagged comments, download attachments
 *  - Does NOT allow: assign, close (HR-only), delete, category management
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardList, Search, X, Loader2, ChevronDown, ChevronLeft, ChevronRight,
  Download, Paperclip, Send, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  MessageSquare, Zap, Eye, Circle, CheckCheck, Inbox, FileText,
  User, Calendar, Tag, Building2,
} from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
  :root {
    --at-serif: 'Fraunces', Georgia, serif;
    --at-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
    --at-ink: #1a1a2e;
    --at-accent: #4f46e5;
    --at-surface: #f4f4f8;
    --at-border: #e4e4ec;
    --at-muted: #8b8ba0;
  }
  .at-root { font-family: var(--at-sans); }
  .at-serif { font-family: var(--at-serif); font-weight:300; }
  @keyframes atFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes atFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes atSlide  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes atPop    { 0%{opacity:0;transform:scale(.96)} 100%{opacity:1;transform:scale(1)} }
  @keyframes atSpin   { to{transform:rotate(360deg)} }
  .at-fade-up { animation:atFadeUp .28s cubic-bezier(.22,1,.36,1) both; }
  .at-fade-in { animation:atFadeIn .18s ease both; }
  .at-slide   { animation:atSlide .3s cubic-bezier(.22,1,.36,1) both; }
  .at-pop     { animation:atPop .2s cubic-bezier(.22,1,.36,1) both; }
  .at-spin    { animation:atSpin .8s linear infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__at_sty__")) {
  const s = document.createElement("style");
  s.id = "__at_sty__"; s.textContent = STYLES;
  document.head.appendChild(s);
}

const atToken = () => localStorage.getItem("access_token") || "";
const atAuth  = () => ({ Authorization: `Bearer ${atToken()}` });
const atJSON  = () => ({ ...atAuth(), "Content-Type": "application/json" });

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

const getTokenData = () => decodeJWT(atToken());

const atFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: atJSON(), ...opts });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(e.detail || "Request failed");
  }
  return res.json();
};

async function atDownload(url, filename) {
  const res = await fetch(url, { headers: atAuth() });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = filename || "file";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(href);
}

const BASE = "http://127.0.0.1:8000/api/v1";
const API = {
  me:          ()    => {
    const tokenData = getTokenData();
    const EPI = tokenData?.EPI;
    return EPI ? `${BASE}/employees/${EPI}/role` : `${BASE}/auth/me`;
  },
  all:         ()    => `${BASE}/tickets`,
  detail:      (id)  => `${BASE}/tickets/${id}`,
  resolve:     (id)  => `${BASE}/tickets/${id}/resolve`,
  comment:     (id)  => `${BASE}/tickets/${id}/comments`,
  mgmtAtts:    (id)  => `${BASE}/tickets/management/${id}/attachments`,
  downloadAtt: (aid) => `${BASE}/tickets/management/attachments/${aid}/download`,
};

const PRIORITY = {
  LOW:      { label:"Low",      color:"#64748b", bg:"#f1f5f9", border:"#cbd5e1", dot:"#94a3b8" },
  MEDIUM:   { label:"Medium",   color:"#4f46e5", bg:"#eef2ff", border:"#c7d2fe", dot:"#6366f1" },
  HIGH:     { label:"High",     color:"#d97706", bg:"#fffbeb", border:"#fcd34d", dot:"#f59e0b" },
  CRITICAL: { label:"Critical", color:"#dc2626", bg:"#fef2f2", border:"#fca5a5", dot:"#ef4444" },
};

const STATUS = {
  OPEN:        { label:"Open",        color:"#4f46e5", bg:"#eef2ff", border:"#c7d2fe", Icon:Circle       },
  IN_PROGRESS: { label:"In Progress", color:"#7c3aed", bg:"#f5f3ff", border:"#c4b5fd", Icon:Zap          },
  RESOLVED:    { label:"Resolved",    color:"#059669", bg:"#ecfdf5", border:"#6ee7b7", Icon:CheckCircle2 },
  CLOSED:      { label:"Closed",      color:"#64748b", bg:"#f8fafc", border:"#e2e8f0", Icon:CheckCheck   },
  CANCELLED:   { label:"Cancelled",   color:"#ef4444", bg:"#fef2f2", border:"#fca5a5", Icon:XCircle      },
};

const PAGE_SIZE = 12;
const fmt = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtFull = d => d ? new Date(d).toLocaleString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";
const sameId = (a, b) => a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b);
const currentEmployeeDbId = (user) => user?.id ?? null;
const isAssignedToCurrentUser = (ticket, user) => {
  const employeeId = currentEmployeeDbId(user);
  return sameId(ticket.assigned_to, employeeId) || sameId(ticket.assignee_id, employeeId) || sameId(ticket.assigned_to_id, employeeId);
};

function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.MEDIUM;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:99,
      fontSize:11, fontWeight:600, border:`1px solid ${p.border}`, color:p.color, background:p.bg }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:p.dot }}/>
      {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.OPEN;
  const { Icon } = s;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:99,
      fontSize:11, fontWeight:600, border:`1px solid ${s.border}`, color:s.color, background:s.bg }}>
      <Icon size={9} strokeWidth={2.5}/>
      {s.label}
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:500, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} className="at-pop" style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
          borderRadius:14, fontSize:13, fontWeight:600, color:"#fff",
          background:t.type==="success"?"#059669":"#dc2626" }}>
          {t.type==="success"?<CheckCircle2 size={14}/>:<AlertTriangle size={14}/>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Ticket Detail Sidebar ────────────────────────────────────────────────────
function AssigneeSidebar({ ticketId, currentUserId, onClose, onUpdated, addToast }) {
  const [ticket, setTicket]   = useState(null);
  const [atts, setAtts]       = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, attsData] = await Promise.all([
        atFetch(API.detail(ticketId)),
        atFetch(API.mgmtAtts(ticketId)).catch(()=>[]),
      ]);
      setTicket(t); setComments(t.comments||[]); setAtts(attsData);
    } catch(e) { addToast(e.message,"error"); }
    finally { setLoading(false); }
  }, [ticketId]);

  useEffect(()=>{ load(); },[load]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      // Assignee comments are marked is_hr:true since they're the resolver
      const c = await atFetch(API.comment(ticketId), {
        method:"POST", body:JSON.stringify({ content:comment.trim(), is_hr:true })
      });
      setComments(p=>[...p,c]); setComment("");
    } catch(e) { addToast(e.message,"error"); }
    finally { setSending(false); }
  };

  const resolveTicket = async () => {
    if (!confirm("Mark this ticket as resolved?")) return;
    setResolving(true);
    try {
      await atFetch(API.resolve(ticketId), { method:"POST" });
      addToast("Ticket marked as resolved","success"); onUpdated();
    } catch(e) { addToast(e.message,"error"); }
    finally { setResolving(false); }
  };

  const handleDownload = async att => {
    setDownloading(att.id);
    try { await atDownload(API.downloadAtt(att.id), att.file_name); }
    catch(e) { addToast(e.message,"error"); }
    finally { setDownloading(null); }
  };

  const canResolve = ticket && ["OPEN","IN_PROGRESS"].includes(ticket.status);
  const canComment = ticket && !["CLOSED","CANCELLED","RESOLVED"].includes(ticket.status);

  return (
    <>
      <div className="at-fade-in" onClick={onClose}
        style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(26,26,46,0.45)", backdropFilter:"blur(3px)" }}/>
      <div className="at-slide" style={{ position:"fixed", right:0, top:0, bottom:0, zIndex:301,
        width:"100%", maxWidth:500, background:"#fff", display:"flex", flexDirection:"column",
        boxShadow:"-6px 0 48px rgba(26,26,46,0.12)", borderLeft:"1px solid #e4e4ec" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #e4e4ec", background:"#1a1a2e",
          display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
          <div style={{ minWidth:0, flex:1 }}>
            {ticket && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                <StatusBadge status={ticket.status}/>
                <PriorityBadge priority={ticket.priority}/>
                <span style={{ fontSize:11, color:"#8b8ba0", fontFamily:"monospace" }}>#{ticket.id}</span>
              </div>
            )}
            <h2 className="at-serif" style={{ color:"#fff", fontSize:18, margin:0, lineHeight:1.3,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {ticket ? ticket.subject : "Loading…"}
            </h2>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:9, border:"1px solid #333", background:"transparent",
              color:"#8b8ba0", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <X size={14}/>
          </button>
        </div>

        {loading ? (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Loader2 size={24} className="at-spin" style={{color:"#e4e4ec"}}/>
          </div>
        ) : ticket ? (
          <div style={{ flex:1, overflowY:"auto" }}>
            {/* Raised by */}
            <div style={{ padding:"16px 24px", borderBottom:"1px solid #e4e4ec", background:"#f8f8fc" }}>
              <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, color:"#8b8ba0", margin:"0 0 10px" }}>Raised By</p>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"#1a1a2e", display:"flex",
                  alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:600, fontSize:14, flexShrink:0 }}>
                  {(ticket.employee?.f_name||"?")[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:600, color:"#1a1a2e", margin:0 }}>
                    {ticket.employee ? `${ticket.employee.f_name} ${ticket.employee.l_name}` : `Employee #${ticket.employee_id}`}
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3, flexWrap:"wrap" }}>
                    {ticket.employee?.designation && (
                      <span style={{ fontSize:12, color:"#8b8ba0" }}>{ticket.employee.designation}</span>
                    )}
                    {ticket.employee?.department?.name && (
                      <span style={{ fontSize:12, color:"#8b8ba0", display:"flex", alignItems:"center", gap:3 }}>
                        <Building2 size={10}/>{ticket.employee.department.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta grid */}
            <div style={{ padding:"16px 24px", borderBottom:"1px solid #e4e4ec" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { label:"Category", value:ticket.category_name||"—" },
                  { label:"Submitted", value:fmt(ticket.created_at) },
                  { label:"Last Update", value:fmt(ticket.updated_at) },
                  { label:"Assignee", value:ticket.assigned_to_name||"You" },
                ].map(({label,value})=>(
                  <div key={label} style={{ background:"#f4f4f8", borderRadius:10, padding:"10px 12px", border:"1px solid #e4e4ec" }}>
                    <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, color:"#8b8ba0", margin:"0 0 4px" }}>{label}</p>
                    <p style={{ fontSize:13, fontWeight:600, color:"#1a1a2e", margin:0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ padding:"16px 24px", borderBottom:"1px solid #e4e4ec" }}>
              <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, color:"#8b8ba0", margin:"0 0 8px" }}>Issue Description</p>
              <p style={{ fontSize:13, color:"#2c2c3e", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap" }}>{ticket.summary}</p>
            </div>

            {/* Attachments */}
            {atts.length > 0 && (
              <div style={{ padding:"16px 24px", borderBottom:"1px solid #e4e4ec" }}>
                <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, color:"#8b8ba0", margin:"0 0 10px" }}>
                  Attachments ({atts.length})
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {atts.map(a=>(
                    <div key={a.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      background:"#f4f4f8", border:"1px solid #e4e4ec", borderRadius:10, padding:"8px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                        <Paperclip size={12} style={{color:"#8b8ba0",flexShrink:0}}/>
                        <span style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#1a1a2e" }}>{a.file_name}</span>
                        {a.file_size && <span style={{ fontSize:11, color:"#8b8ba0", flexShrink:0 }}>({(a.file_size/1024).toFixed(0)} KB)</span>}
                      </div>
                      <button onClick={()=>handleDownload(a)} disabled={downloading===a.id}
                        style={{ display:"flex", alignItems:"center", gap:4, color:"#4f46e5", fontSize:11, fontWeight:600,
                          border:"none", background:"none", cursor:"pointer", flexShrink:0, marginLeft:8, opacity:downloading===a.id?0.5:1 }}>
                        {downloading===a.id?<Loader2 size={11} className="at-spin"/>:<Download size={11}/>}
                        {downloading===a.id?"…":"Download"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div style={{ padding:"16px 24px" }}>
              <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, color:"#8b8ba0", margin:"0 0 12px" }}>
                Thread ({comments.length})
              </p>
              {comments.length===0 ? (
                <div style={{ textAlign:"center", padding:"28px 0" }}>
                  <MessageSquare size={20} style={{margin:"0 auto 8px",color:"#e4e4ec",display:"block"}}/>
                  <p style={{ fontSize:12, color:"#8b8ba0", margin:0 }}>No comments yet</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
                  {comments.map((c,i)=>(
                    <div key={c.id||i} style={{ borderRadius:14, padding:"12px 14px",
                      background:c.is_hr?"#eef2ff":"#f4f4f8", border:`1px solid ${c.is_hr?"#c7d2fe":"#e4e4ec"}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                          background:c.is_hr?"#4f46e5":"#1a1a2e", color:"#fff", fontSize:10, fontWeight:700, flexShrink:0 }}>
                          {(c.author_name||"?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:"#1a1a2e" }}>{c.author_name||"User"}</span>
                        {c.is_hr && (
                          <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:99, background:"#e0e7ff", color:"#4f46e5" }}>Resolver</span>
                        )}
                        <span style={{ fontSize:11, color:"#8b8ba0", marginLeft:"auto" }}>{fmtFull(c.created_at)}</span>
                      </div>
                      <p style={{ fontSize:13, color:"#2c2c3e", lineHeight:1.6, margin:0 }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
              {canComment && (
                <div style={{ display:"flex", gap:8 }}>
                  <input value={comment} onChange={e=>setComment(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendComment()}
                    placeholder="Add a resolution note…"
                    style={{ flex:1, border:"1px solid #e4e4ec", borderRadius:10, padding:"10px 14px",
                      fontSize:13, background:"#f4f4f8", outline:"none", fontFamily:"inherit" }}/>
                  <button onClick={sendComment} disabled={sending||!comment.trim()}
                    style={{ width:40, height:40, borderRadius:10, border:"none", background:"#4f46e5",
                      cursor:sending||!comment.trim()?"not-allowed":"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      opacity:sending||!comment.trim()?0.4:1 }}>
                    {sending?<Loader2 size={14} className="at-spin" style={{color:"#fff"}}/>:<Send size={14} style={{color:"#fff"}}/>}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Resolve footer */}
        {canResolve && (
          <div style={{ padding:"16px 24px", borderTop:"1px solid #e4e4ec" }}>
            <button onClick={resolveTicket} disabled={resolving}
              style={{ width:"100%", padding:"12px 0", border:"none", background:"#059669",
                borderRadius:12, fontSize:13, fontWeight:600, color:"#fff",
                cursor:resolving?"not-allowed":"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", gap:8, opacity:resolving?0.6:1 }}>
              {resolving?<Loader2 size={13} className="at-spin"/>:<CheckCircle2 size={13}/>}
              Mark as Resolved
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ═══ MAIN ═════════════════════════════════════════════════════════════════════
export default function AssignedTickets() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [detailId, setDetailId] = useState(null);
  const [toasts, setToasts]     = useState([]);

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatus]     = useState("All");
  const [priorityFilter, setPriority] = useState("All");
  const [page, setPage]               = useState(1);

  const addToast = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, allTickets] = await Promise.all([
        atFetch(API.me()),
        atFetch(API.all()),
      ]);
      setCurrentUser(me);
      const list = Array.isArray(allTickets) ? allTickets : allTickets.items || [];
      setTickets(list.filter(t => isAssignedToCurrentUser(t, me)));
    } catch(e) { addToast(e.message,"error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ setPage(1); },[search,statusFilter,priorityFilter]);

  const filtered = useMemo(()=>{
    const q = search.toLowerCase();
    return tickets
      .filter(t=>statusFilter==="All"||t.status===statusFilter)
      .filter(t=>priorityFilter==="All"||t.priority===priorityFilter)
      .filter(t=>!q||(t.subject||"").toLowerCase().includes(q)||(t.category_name||"").toLowerCase().includes(q)||String(t.id).includes(q))
      .sort((a,b)=>{
        const pO={CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3};
        const pd=(pO[a.priority]||2)-(pO[b.priority]||2);
        return pd!==0?pd:new Date(b.created_at)-new Date(a.created_at);
      });
  },[tickets,search,statusFilter,priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const counts = useMemo(()=>({
    open:      tickets.filter(t=>t.status==="OPEN").length,
    progress:  tickets.filter(t=>t.status==="IN_PROGRESS").length,
    resolved:  tickets.filter(t=>t.status==="RESOLVED").length,
    critical:  tickets.filter(t=>t.priority==="CRITICAL").length,
  }),[tickets]);

  const pageNums = useMemo(()=>{
    const nums = Array.from({length:totalPages},(_,i)=>i+1);
    return nums.filter(n=>n===1||n===totalPages||Math.abs(n-page)<=1)
      .reduce((acc,n,i,arr)=>{if(i>0&&n-arr[i-1]>1)acc.push("...");acc.push(n);return acc;},[]);
  },[totalPages,page]);

  const sel = { padding:"8px 12px", border:"1px solid #e4e4ec", borderRadius:10, fontSize:13,
    color:"#1a1a2e", background:"#fff", outline:"none", cursor:"pointer", fontFamily:"inherit", appearance:"none" };

  if (loading) return (
    <div className="at-root" style={{ minHeight:"100vh", background:"#f4f4f8", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Loader2 size={28} className="at-spin" style={{color:"#8b8ba0"}}/>
    </div>
  );

  if (!loading && tickets.length === 0 && currentUser) return (
    <div className="at-root" style={{ minHeight:"100vh", background:"#f4f4f8", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", maxWidth:360, padding:"0 24px" }}>
        <div style={{ width:72, height:72, borderRadius:20, background:"#eef2ff", display:"flex",
          alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <ClipboardList size={28} style={{color:"#4f46e5"}}/>
        </div>
        <h2 className="at-serif" style={{ fontSize:26, color:"#1a1a2e", margin:"0 0 10px" }}>No Assigned Tickets</h2>
        <p style={{ fontSize:14, color:"#8b8ba0", lineHeight:1.6, margin:0 }}>
          You don't have any tickets assigned to you right now. When HR assigns a ticket, it will appear here.
        </p>
      </div>
    </div>
  );

  return (
    <div className="at-root" style={{ minHeight:"100vh", background:"#f4f4f8" }}>
      <Toast toasts={toasts}/>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 24px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:32, gap:16 }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#eef2ff",
              border:"1px solid #c7d2fe", borderRadius:99, padding:"4px 12px", marginBottom:10 }}>
              <ClipboardList size={12} style={{color:"#4f46e5"}}/>
              <span style={{ fontSize:11, fontWeight:600, color:"#4f46e5", textTransform:"uppercase", letterSpacing:"0.08em" }}>Assigned to Me</span>
            </div>
            <h1 className="at-serif" style={{ fontSize:36, margin:0, color:"#1a1a2e" }}>My Work Queue</h1>
            <p style={{ fontSize:13, color:"#8b8ba0", margin:"6px 0 0" }}>
              Tickets assigned to {currentUser?.f_name} {currentUser?.l_name}
            </p>
          </div>
          <button onClick={load} style={{ width:38, height:38, borderRadius:10, border:"1px solid #e4e4ec",
            background:"#fff", color:"#8b8ba0", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <RefreshCw size={14}/>
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
          {[
            { label:"Open", value:counts.open, color:"#eef2ff", text:"#4f46e5", accent:"#4f46e5" },
            { label:"In Progress", value:counts.progress, color:"#f5f3ff", text:"#7c3aed", accent:"#7c3aed" },
            { label:"Resolved", value:counts.resolved, color:"#ecfdf5", text:"#059669", accent:"#059669" },
            { label:"Critical", value:counts.critical, color:"#fef2f2", text:"#dc2626", accent:"#dc2626" },
          ].map(({label,value,color,text,accent})=>(
            <div key={label} style={{ background:"#fff", borderRadius:14, padding:"16px 20px",
              border:`1.5px solid ${color}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:accent }}/>
              <p style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color:"#8b8ba0", margin:"8px 0 6px" }}>{label}</p>
              <p className="at-serif" style={{ fontSize:36, color:text, margin:0, lineHeight:1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:"#fff", borderRadius:18, border:"1px solid #e4e4ec", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #e4e4ec", display:"flex", flexWrap:"wrap", alignItems:"center", gap:10 }}>
            <div style={{ position:"relative", flex:1, minWidth:160 }}>
              <Search size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#8b8ba0" }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets…"
                style={{ width:"100%", border:"1px solid #e4e4ec", borderRadius:10, padding:"8px 12px 8px 34px",
                  fontSize:13, background:"#f4f4f8", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
            </div>
            <select value={statusFilter} onChange={e=>setStatus(e.target.value)} style={sel}>
              <option value="All">All Status</option>
              {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={priorityFilter} onChange={e=>setPriority(e.target.value)} style={sel}>
              <option value="All">All Priority</option>
              {Object.entries(PRIORITY).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            {(search||statusFilter!=="All"||priorityFilter!=="All") && (
              <button onClick={()=>{setSearch("");setStatus("All");setPriority("All");}}
                style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 10px", fontSize:12,
                  color:"#8b8ba0", border:"none", background:"none", cursor:"pointer", borderRadius:8 }}>
                <X size={11}/>Clear
              </button>
            )}
            <span style={{ marginLeft:"auto", fontSize:12, color:"#8b8ba0" }}>{filtered.length} ticket{filtered.length!==1?"s":""}</span>
          </div>

          {paged.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px 20px" }}>
              <Inbox size={24} style={{color:"#e4e4ec",display:"block",margin:"0 auto 12px"}}/>
              <p style={{ fontSize:14, color:"#8b8ba0", margin:0 }}>No tickets match your filters</p>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #f0eff8", background:"#fafafa" }}>
                    {["#","Subject","Raised By","Category","Priority","Status","Submitted",""].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10,
                        fontWeight:700, color:"#8b8ba0", textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((t,i)=>{
                    const empName = t.employee ? `${t.employee.f_name} ${t.employee.l_name}` : `#${t.employee_id}`;
                    return (
                      <tr key={t.id} className="at-fade-up" onClick={()=>setDetailId(t.id)}
                        style={{ borderBottom:"1px solid #f4f4f8", cursor:"pointer", animationDelay:`${i*20}ms` }}
                        onMouseEnter={e=>e.currentTarget.style.background="#fafafa"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"14px 16px", fontSize:12, color:"#8b8ba0", fontFamily:"monospace" }}>#{t.id}</td>
                        <td style={{ padding:"14px 16px", maxWidth:180 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#1a1a2e", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.subject}</p>
                        </td>
                        <td style={{ padding:"14px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:8, background:"#1a1a2e",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              color:"#fff", fontSize:11, fontWeight:600, flexShrink:0 }}>
                              {(empName[0]||"?").toUpperCase()}
                            </div>
                            <span style={{ fontSize:13, fontWeight:500, color:"#1a1a2e", whiteSpace:"nowrap" }}>{empName}</span>
                          </div>
                        </td>
                        <td style={{ padding:"14px 16px" }}>
                          <span style={{ fontSize:11, background:"#f4f4f8", color:"#6b6580",
                            padding:"4px 10px", borderRadius:8, border:"1px solid #e4e4ec", whiteSpace:"nowrap" }}>
                            {t.category_name||"—"}
                          </span>
                        </td>
                        <td style={{ padding:"14px 16px" }}><PriorityBadge priority={t.priority}/></td>
                        <td style={{ padding:"14px 16px" }}><StatusBadge status={t.status}/></td>
                        <td style={{ padding:"14px 16px", fontSize:12, color:"#8b8ba0", whiteSpace:"nowrap" }}>{fmt(t.created_at)}</td>
                        <td style={{ padding:"14px 16px" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#8b8ba0" }}>
                            <Eye size={12}/>View
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderTop:"1px solid #f0eff8" }}>
              <span style={{ fontSize:12, color:"#8b8ba0" }}>
                {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}
              </span>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{ width:32, height:32, borderRadius:9, border:"1px solid #e4e4ec", background:"#fff",
                    color:"#8b8ba0", cursor:page===1?"not-allowed":"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center", opacity:page===1?0.4:1 }}>
                  <ChevronLeft size={14}/>
                </button>
                {pageNums.map((n,i)=>n==="..."?(
                  <span key={`el-${i}`} style={{ width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#8b8ba0" }}>…</span>
                ):(
                  <button key={n} onClick={()=>setPage(n)}
                    style={{ width:32,height:32,borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",
                      border:page===n?"none":"1px solid #e4e4ec",
                      background:page===n?"#4f46e5":"#fff",
                      color:page===n?"#fff":"#6b6580" }}>
                    {n}
                  </button>
                ))}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{ width:32,height:32,borderRadius:9,border:"1px solid #e4e4ec",background:"#fff",
                    color:"#8b8ba0",cursor:page===totalPages?"not-allowed":"pointer",display:"flex",
                    alignItems:"center",justifyContent:"center",opacity:page===totalPages?0.4:1 }}>
                  <ChevronRight size={14}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailId && (
        <AssigneeSidebar
          ticketId={detailId}
          currentUserId={currentUser?.id}
          onClose={()=>setDetailId(null)}
          onUpdated={()=>{setDetailId(null);load();}}
          addToast={addToast}
        />
      )}
    </div>
  );
}

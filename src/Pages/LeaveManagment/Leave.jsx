import React, { useState, useEffect, useCallback, useMemo } from "react";

/* ─────────────────────────────────────────────
   API ENDPOINTS  (matches your Apis.js)
──────────────────────────────────────────────── */
const BASE = "http://127.0.0.1:8000/api/v1";

const API = {
  LeaveTypes:           `${BASE}/leaves/types`,
  LeaveTypeById:        (id) => `${BASE}/leaves/types/${id}`,
  MyLeaveBalance:       `${BASE}/leaves/balance`,
  MyLeaveBalanceByType: (id) => `${BASE}/leaves/balance/${id}`,
  MyLeaves:             `${BASE}/leaves/my`,
  ApplyLeave:           `${BASE}/leaves/apply`,
  CancelLeave:          (id) => `${BASE}/leaves/${id}/cancel`,
  PendingLeaves:        `${BASE}/leaves/pending`,
  LeaveAction:          (id) => `${BASE}/leaves/${id}/action`,
  EmployeeLeaves:       (id) => `${BASE}/leaves/employee/${id}`,
  EmployeeLeaveBalance: (id) => `${BASE}/leaves/employee/${id}/balance`,
  LeaveStatsByStatus:   `${BASE}/leaves/stats/by-status`,
  AllocateLeave:        `${BASE}/leaves/allocate`,
};

/* ─────────────────────────────────────────────
   AUTH HELPERS
──────────────────────────────────────────────── */
function getToken() { return localStorage.getItem("access_token"); }

function decodeToken() {
  try {
    const t = getToken();
    if (!t) return null;
    return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch { return null; }
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

const ROLE_RANK = { employee: 0, hr: 1, hr_head: 2, ceo: 3, admin: 3 };
const APPROVER_ROLES = new Set(["hr", "hr_head", "ceo", "admin"]);

/* ─────────────────────────────────────────────
   STATUS HELPERS
──────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:   { color: "#b45309", bg: "#fef3c7", border: "#fde68a", dot: "#d97706", label: "Pending"   },
  approved:  { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", dot: "#10b981", label: "Approved"  },
  rejected:  { color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", dot: "#ef4444", label: "Rejected"  },
  cancelled: { color: "#374151", bg: "#f3f4f6", border: "#d1d5db", dot: "#9ca3af", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20,
      background:cfg.bg, border:`1px solid ${cfg.border}`,
      color:cfg.color, fontSize:11, fontWeight:600,
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",background:cfg.dot,display:"inline-block"}}/>
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   REUSABLE UI PRIMITIVES
──────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background:"#fff", borderRadius:14,
      border:"1px solid #f0ebe8", padding:"20px 22px",
      ...style
    }}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{
        width:32,height:32,border:"3px solid #f0ebe8",
        borderTop:"3px solid #e8502a",borderRadius:"50%",
        animation:"spin 0.7s linear infinite"
      }}/>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{textAlign:"center",padding:"48px 24px",color:"#9b9b9b"}}>
      <div style={{fontSize:38,marginBottom:10}}>{icon}</div>
      <div style={{fontSize:15,fontWeight:600,color:"#555",marginBottom:4}}>{title}</div>
      <div style={{fontSize:13}}>{sub}</div>
    </div>
  );
}

function Btn({ children, variant="primary", onClick, disabled, style={}, size="md" }) {
  const base = {
    display:"inline-flex", alignItems:"center", gap:7,
    border:"none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily:"inherit", fontWeight:500, transition:"all .15s",
    borderRadius:9, opacity: disabled ? 0.55 : 1,
    padding: size==="sm" ? "6px 14px" : "10px 20px",
    fontSize: size==="sm" ? 12 : 13,
  };
  const variants = {
    primary: { background:"#e8502a", color:"#fff" },
    ghost:   { background:"transparent", color:"#555", border:"1px solid #e5e0dc" },
    danger:  { background:"#fee2e2", color:"#991b1b", border:"1px solid #fca5a5" },
    success: { background:"#d1fae5", color:"#065f46", border:"1px solid #6ee7b7" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{...base,...variants[variant],...style}}>
      {children}
    </button>
  );
}

function Select({ value, onChange, children, style={} }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{
        padding:"8px 12px", borderRadius:9, border:"1px solid #e5e0dc",
        background:"#fff", fontSize:13, color:"#333", fontFamily:"inherit",
        cursor:"pointer", outline:"none", ...style
      }}>
      {children}
    </select>
  );
}

function Input({ value, onChange, type="text", placeholder, style={}, ...rest }) {
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} type={type}
      placeholder={placeholder} {...rest}
      style={{
        padding:"9px 12px", borderRadius:9, border:"1px solid #e5e0dc",
        background:"#fff", fontSize:13, color:"#333", fontFamily:"inherit",
        outline:"none", width:"100%", boxSizing:"border-box", ...style
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows=3, style={} }) {
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        padding:"9px 12px", borderRadius:9, border:"1px solid #e5e0dc",
        background:"#fff", fontSize:13, color:"#333", fontFamily:"inherit",
        outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical", ...style
      }}
    />
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em"}}>
        {label}{required && <span style={{color:"#e8502a",marginLeft:2}}>*</span>}
      </label>
      {children}
      {hint && <span style={{fontSize:11,color:"#aaa"}}>{hint}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BALANCE DONUT CHART
──────────────────────────────────────────────── */
function BalanceDonut({ used, total, color }) {
  const r = 28, stroke = 6, circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const dash = pct * circ;
  return (
    <svg width={70} height={70} viewBox="0 0 70 70">
      <circle cx={35} cy={35} r={r} fill="none" stroke="#f0ebe8" strokeWidth={stroke}/>
      <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ/4}
        strokeLinecap="round" style={{transition:"stroke-dasharray .5s ease"}}
      />
      <text x={35} y={38} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1a1a1a">
        {(total - used).toFixed(1)}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   BALANCE CARDS
──────────────────────────────────────────────── */
const PALETTE = ["#e8502a","#3b82f6","#10b981","#8b5cf6","#f59e0b","#ec4899","#14b8a6"];

function BalanceSection({ balances, leaveTypes }) {
  if (!balances?.length) return (
    <Card>
      <EmptyState icon="📊" title="No balance data" sub="Contact HR to set up your leave allocations." />
    </Card>
  );

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
      {balances.map((b, i) => {
        const lt = leaveTypes.find(x => x.id === b.leave_type_id);
        const color = PALETTE[i % PALETTE.length];
        const total = (b.allocated_days || 0) + (b.carried_forward || 0);
        const used  = b.used_days || 0;
        const left  = total - used;
        return (
          <Card key={b.id || i} style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{lt?.name || b.leave_type?.name || "Leave"}</div>
                {lt?.code && <div style={{fontSize:10,color:color,fontWeight:600,marginTop:2}}>{lt.code}</div>}
              </div>
              <BalanceDonut used={used} total={total} color={color} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:11}}>
              <div style={{textAlign:"center",padding:"6px 4px",background:"#f8f6f4",borderRadius:7}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>{left.toFixed(1)}</div>
                <div style={{color:"#9b9b9b",marginTop:1}}>Left</div>
              </div>
              <div style={{textAlign:"center",padding:"6px 4px",background:"#f8f6f4",borderRadius:7}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>{used.toFixed(1)}</div>
                <div style={{color:"#9b9b9b",marginTop:1}}>Used</div>
              </div>
              <div style={{textAlign:"center",padding:"6px 4px",background:"#f8f6f4",borderRadius:7}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>{total.toFixed(1)}</div>
                <div style={{color:"#9b9b9b",marginTop:1}}>Total</div>
              </div>
            </div>
            {b.carried_forward > 0 && (
              <div style={{
                fontSize:10,color:"#3b82f6",background:"#eff6ff",
                borderRadius:6,padding:"3px 8px",textAlign:"center",border:"1px solid #bfdbfe"
              }}>
                +{b.carried_forward} carried forward
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   APPLY LEAVE FORM
──────────────────────────────────────────────── */
function ApplyLeaveForm({ leaveTypes, onSuccess }) {
  const [form, setForm] = useState({
    leave_type_id: "", start_date: "", end_date: "", days: "", reason: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedType = leaveTypes.find(t => t.id === Number(form.leave_type_id));

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const s = new Date(form.start_date), e = new Date(form.end_date);
      if (e >= s) {
        const diff = Math.round((e - s) / 86400000) + 1;
        setForm(f => ({ ...f, days: String(diff) }));
      }
    }
  }, [form.start_date, form.end_date]);

  const submit = async () => {
    setError(""); setSuccess(false);
    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.days) {
      return setError("Please fill in all required fields.");
    }
    setLoading(true);
    try {
      const r = await fetch(API.ApplyLeave, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          leave_type_id: Number(form.leave_type_id),
          start_date: form.start_date, end_date: form.end_date,
          days: Number(form.days), reason: form.reason || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed to submit leave.");
      setSuccess(true);
      setForm({ leave_type_id:"", start_date:"", end_date:"", days:"", reason:"" });
      onSuccess?.();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card style={{maxWidth:580}}>
      <div style={{marginBottom:22}}>
        <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a"}}>Apply for Leave</div>
        <div style={{fontSize:12,color:"#9b9b9b",marginTop:2}}>Submit a new leave request</div>
      </div>

      {success && (
        <div style={{
          background:"#d1fae5",border:"1px solid #6ee7b7",borderRadius:9,
          padding:"10px 14px",fontSize:13,color:"#065f46",marginBottom:16,
          display:"flex",alignItems:"center",gap:8
        }}>
          ✓ Leave request submitted successfully!
        </div>
      )}
      {error && (
        <div style={{
          background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:9,
          padding:"10px 14px",fontSize:13,color:"#991b1b",marginBottom:16
        }}>
          {error}
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Field label="Leave Type" required>
          <Select value={form.leave_type_id} onChange={v=>setForm(f=>({...f,leave_type_id:v}))}>
            <option value="">Select leave type…</option>
            {leaveTypes.filter(t=>t.is_active).map(t => (
              <option key={t.id} value={t.id}>{t.name}{t.code ? ` (${t.code})` : ""}</option>
            ))}
          </Select>
        </Field>

        {selectedType && (
          <div style={{
            display:"flex",flexWrap:"wrap",gap:8,
            background:"#fff8f5",borderRadius:9,padding:"10px 14px",
            border:"1px solid #fde0d4",fontSize:11
          }}>
            {selectedType.is_paid && <span style={{background:"#d1fae5",color:"#065f46",padding:"2px 8px",borderRadius:12,border:"1px solid #6ee7b7"}}>Paid</span>}
            {!selectedType.is_paid && <span style={{background:"#fee2e2",color:"#991b1b",padding:"2px 8px",borderRadius:12,border:"1px solid #fca5a5"}}>Unpaid</span>}
            {selectedType.requires_document && <span style={{background:"#fef3c7",color:"#92400e",padding:"2px 8px",borderRadius:12,border:"1px solid #fde68a"}}>Document required</span>}
            {selectedType.min_days && <span style={{color:"#555"}}>Min: {selectedType.min_days}d</span>}
            {selectedType.max_days_per_request && <span style={{color:"#555"}}>Max: {selectedType.max_days_per_request}d</span>}
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Start Date" required>
            <Input type="date" value={form.start_date} onChange={v=>setForm(f=>({...f,start_date:v}))} />
          </Field>
          <Field label="End Date" required>
            <Input type="date" value={form.end_date} onChange={v=>setForm(f=>({...f,end_date:v}))} min={form.start_date} />
          </Field>
        </div>

        <Field label="Number of Days" required hint="Auto-calculated from dates">
          <Input type="number" value={form.days} onChange={v=>setForm(f=>({...f,days:v}))} placeholder="e.g. 3" style={{width:120}} />
        </Field>

        <Field label="Reason">
          <Textarea value={form.reason} onChange={v=>setForm(f=>({...f,reason:v}))} placeholder="Optional — briefly describe the reason…" />
        </Field>

        <Btn onClick={submit} disabled={loading} style={{alignSelf:"flex-start"}}>
          {loading ? "Submitting…" : "Submit Request"}
        </Btn>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   MY REQUESTS TABLE
──────────────────────────────────────────────── */
function MyRequests({ refresh }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `${API.MyLeaves}?status=${statusFilter}` : API.MyLeaves;
      const r = await fetch(url, { headers: authHeaders() });
      const d = await r.json();
      setRequests(Array.isArray(d) ? d : []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load, refresh]);

  const doCancel = async (id) => {
    setCancelling(true);
    try {
      await fetch(API.CancelLeave(id), { method:"DELETE", headers: authHeaders() });
      load();
    } finally { setCancelling(false); setCancelId(null); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a"}}>My Leave Requests</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Select value={statusFilter} onChange={setStatusFilter} style={{fontSize:12}}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Btn variant="ghost" onClick={load} size="sm">↻ Refresh</Btn>
        </div>
      </div>

      {loading ? <Spinner /> : requests.length === 0
        ? <Card><EmptyState icon="📭" title="No requests found" sub="You haven't submitted any leave requests yet." /></Card>
        : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {requests.map(req => (
              <Card key={req.id} style={{display:"flex",flexDirection:"column",gap:0,padding:0,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid #f5f0ee"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{
                      width:38,height:38,borderRadius:10,
                      background:"#fff1ee",border:"1px solid #fde0d4",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:16,flexShrink:0
                    }}>📋</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:"#1a1a1a"}}>
                        {req.leave_type?.name || "Leave"}
                        {req.leave_type?.code && <span style={{marginLeft:6,fontSize:10,color:"#e8502a",fontWeight:600}}>({req.leave_type.code})</span>}
                      </div>
                      <div style={{fontSize:11,color:"#9b9b9b",marginTop:2}}>
                        {req.start_date} → {req.end_date} &nbsp;·&nbsp; <strong>{req.days}d</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <StatusBadge status={req.status} />
                    {req.status === "pending" && (
                      cancelId === req.id
                        ? (
                          <div style={{display:"flex",gap:6}}>
                            <Btn variant="danger" size="sm" onClick={()=>doCancel(req.id)} disabled={cancelling}>
                              {cancelling ? "…" : "Confirm"}
                            </Btn>
                            <Btn variant="ghost" size="sm" onClick={()=>setCancelId(null)}>Keep</Btn>
                          </div>
                        )
                        : <Btn variant="ghost" size="sm" onClick={()=>setCancelId(req.id)}>Cancel</Btn>
                    )}
                  </div>
                </div>
                {req.reason && (
                  <div style={{padding:"10px 18px",fontSize:12,color:"#6b7280",background:"#fafafa"}}>
                    <span style={{fontWeight:600,color:"#9b9b9b",marginRight:6}}>Reason:</span>{req.reason}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}

/* ─────────────────────────────────────────────
   APPROVAL PANEL  (HR/Admin)
──────────────────────────────────────────────── */
function ApprovalPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [noteMap, setNoteMap] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `${BASE}/leaves/requests?status=${statusFilter}&limit=200`
        : `${BASE}/leaves/requests?limit=200`;
      const r = await fetch(url, { headers: authHeaders() });
      const d = await r.json();
      setRequests(Array.isArray(d) ? d : []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id, action) => {
    setActing(id + action);
    try {
      await fetch(API.LeaveAction(id), {
        method:"POST", headers: authHeaders(),
        body: JSON.stringify({ status: action, reason: noteMap[id] || null }),
      });
      load();
    } finally { setActing(null); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a"}}>Leave Approvals</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Select value={statusFilter} onChange={setStatusFilter} style={{fontSize:12}}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </Select>
          <Btn variant="ghost" onClick={load} size="sm">↻ Refresh</Btn>
        </div>
      </div>

      {loading ? <Spinner /> : requests.length === 0
        ? <Card><EmptyState icon="✅" title="No requests" sub="No leave requests match the selected filter." /></Card>
        : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {requests.map(req => (
              <Card key={req.id} style={{padding:0,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"14px 18px",gap:12,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{
                      width:40,height:40,borderRadius:11,
                      background:"linear-gradient(135deg,#e8502a,#f08450)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#fff",fontSize:13,fontWeight:700,flexShrink:0
                    }}>
                      {String(req.employee_id).slice(-2)}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Employee #{req.employee_id}</div>
                      <div style={{fontSize:12,color:"#555",marginTop:2}}>
                        <strong>{req.leave_type?.name || "Leave"}</strong>
                        {req.leave_type?.code && <span style={{marginLeft:5,color:"#e8502a",fontWeight:600,fontSize:10}}>({req.leave_type.code})</span>}
                      </div>
                      <div style={{fontSize:11,color:"#9b9b9b",marginTop:2}}>
                        {req.start_date} → {req.end_date} &nbsp;·&nbsp; <strong style={{color:"#333"}}>{req.days} days</strong>
                      </div>
                      {req.reason && (
                        <div style={{fontSize:11,color:"#6b7280",marginTop:4,fontStyle:"italic"}}>"{req.reason}"</div>
                      )}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                    <StatusBadge status={req.status} />
                    <div style={{fontSize:10,color:"#bbb"}}>#{req.id} · {req.created_at?.slice(0,10)}</div>
                  </div>
                </div>

                {req.status === "pending" && (
                  <div style={{padding:"10px 18px 14px",borderTop:"1px solid #f5f0ee",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <Btn variant="success" size="sm"
                      disabled={acting === req.id+"approved"}
                      onClick={()=>doAction(req.id,"approved")}>
                      ✓ Approve
                    </Btn>
                    <Btn variant="danger" size="sm"
                      disabled={acting === req.id+"rejected"}
                      onClick={()=>doAction(req.id,"rejected")}>
                      ✗ Reject
                    </Btn>
                    <Btn variant="ghost" size="sm"
                      disabled={acting === req.id+"cancelled"}
                      onClick={()=>doAction(req.id,"cancelled")}>
                      Cancel
                    </Btn>
                    <input
                      value={noteMap[req.id] || ""}
                      onChange={e=>setNoteMap(m=>({...m,[req.id]:e.target.value}))}
                      placeholder="Add note (optional)…"
                      style={{
                        flex:1,minWidth:140,padding:"5px 10px",borderRadius:7,
                        border:"1px solid #e5e0dc",fontSize:11,fontFamily:"inherit",
                        outline:"none",background:"#fafafa"
                      }}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}

/* ─────────────────────────────────────────────
   LEAVE TYPES ADMIN
──────────────────────────────────────────────── */
function LeaveTypesAdmin({ leaveTypes, onRefresh }) {
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name:"", code:"", description:"", days_per_year:"",
    carry_forward:false, max_carry_forward:"",
    allow_negative_balance:false, is_paid:true,
    requires_document:false, is_active:true,
    min_days:"", max_days_per_request:"",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setForm({ name:"",code:"",description:"",days_per_year:"",carry_forward:false,
      max_carry_forward:"",allow_negative_balance:false,is_paid:true,
      requires_document:false,is_active:true,min_days:"",max_days_per_request:"" });
    setCreating(false); setEditId(null); setError("");
  };

  const startEdit = (lt) => {
    setForm({ name:lt.name, code:lt.code||"", description:lt.description||"",
      days_per_year:lt.days_per_year, carry_forward:lt.carry_forward,
      max_carry_forward:lt.max_carry_forward||"", allow_negative_balance:lt.allow_negative_balance,
      is_paid:lt.is_paid, requires_document:lt.requires_document, is_active:lt.is_active,
      min_days:lt.min_days||"", max_days_per_request:lt.max_days_per_request||"" });
    setEditId(lt.id); setCreating(false);
  };

  const save = async () => {
    setError(""); setLoading(true);
    try {
      const body = {
        ...form,
        days_per_year: Number(form.days_per_year) || 0,
        max_carry_forward: form.max_carry_forward ? Number(form.max_carry_forward) : null,
        min_days: form.min_days ? Number(form.min_days) : null,
        max_days_per_request: form.max_days_per_request ? Number(form.max_days_per_request) : null,
        code: form.code || null,
      };
      const url = editId ? API.LeaveTypeById(editId) : API.LeaveTypes;
      const method = editId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed.");
      onRefresh?.(); reset();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const toggle = async (lt) => {
    await fetch(API.LeaveTypeById(lt.id), {
      method:"PATCH", headers: authHeaders(),
      body: JSON.stringify({ is_active: !lt.is_active })
    });
    onRefresh?.();
  };

  const showForm = creating || editId !== null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:16,fontWeight:700,color:"#1a1a1a"}}>Leave Types</div>
        {!showForm && <Btn onClick={()=>setCreating(true)}>+ New Type</Btn>}
      </div>

      {showForm && (
        <Card style={{border:"1px solid #fde0d4"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:16}}>
            {editId ? "Edit Leave Type" : "Create Leave Type"}
          </div>
          {error && <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#991b1b",marginBottom:12}}>{error}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Name" required><Input value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="e.g. Annual Leave" /></Field>
            <Field label="Code"><Input value={form.code} onChange={v=>setForm(f=>({...f,code:v}))} placeholder="e.g. AL" /></Field>
            <Field label="Days per Year" required><Input type="number" value={form.days_per_year} onChange={v=>setForm(f=>({...f,days_per_year:v}))} placeholder="e.g. 14" /></Field>
            <Field label="Min Days"><Input type="number" value={form.min_days} onChange={v=>setForm(f=>({...f,min_days:v}))} placeholder="e.g. 0.5" /></Field>
            <Field label="Max Days / Request"><Input type="number" value={form.max_days_per_request} onChange={v=>setForm(f=>({...f,max_days_per_request:v}))} placeholder="e.g. 10" /></Field>
            <Field label="Max Carry Forward"><Input type="number" value={form.max_carry_forward} onChange={v=>setForm(f=>({...f,max_carry_forward:v}))} placeholder="e.g. 5" /></Field>
          </div>
          <div style={{display:"flex",gap:12,marginTop:12,flexWrap:"wrap"}}>
            {[
              ["carry_forward","Allow Carry Forward"],
              ["allow_negative_balance","Allow Negative Balance"],
              ["is_paid","Paid Leave"],
              ["requires_document","Requires Document"],
              ["is_active","Active"],
            ].map(([key,label]) => (
              <label key={key} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#555",cursor:"pointer"}}>
                <input type="checkbox" checked={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.checked}))} />
                {label}
              </label>
            ))}
          </div>
          <Field label="Description" style={{marginTop:12}}>
            <Textarea value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} placeholder="Optional description…" rows={2} />
          </Field>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <Btn onClick={save} disabled={loading}>{loading ? "Saving…" : editId ? "Save Changes" : "Create"}</Btn>
            <Btn variant="ghost" onClick={reset}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {leaveTypes.map((lt, i) => (
          <Card key={lt.id} style={{opacity: lt.is_active ? 1 : 0.6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>{lt.name}</span>
                  {lt.code && (
                    <span style={{
                      background:PALETTE[i%PALETTE.length]+"22",
                      color:PALETTE[i%PALETTE.length],
                      fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:12
                    }}>{lt.code}</span>
                  )}
                </div>
                {lt.description && <div style={{fontSize:11,color:"#9b9b9b",marginTop:2}}>{lt.description}</div>}
              </div>
              <div style={{display:"flex",gap:5}}>
                <Btn variant="ghost" size="sm" onClick={()=>startEdit(lt)}>Edit</Btn>
                <Btn variant={lt.is_active?"danger":"success"} size="sm" onClick={()=>toggle(lt)}>
                  {lt.is_active ? "Deactivate" : "Activate"}
                </Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:11}}>
              <div style={{background:"#f8f6f4",borderRadius:7,padding:"6px",textAlign:"center"}}>
                <div style={{fontWeight:700,color:"#1a1a1a"}}>{lt.days_per_year}</div>
                <div style={{color:"#9b9b9b"}}>Days/yr</div>
              </div>
              <div style={{background:"#f8f6f4",borderRadius:7,padding:"6px",textAlign:"center"}}>
                <div style={{fontWeight:700,color:"#1a1a1a"}}>{lt.max_days_per_request || "∞"}</div>
                <div style={{color:"#9b9b9b"}}>Max/req</div>
              </div>
              <div style={{background:"#f8f6f4",borderRadius:7,padding:"6px",textAlign:"center"}}>
                <div style={{fontWeight:700,color:"#1a1a1a"}}>{lt.max_carry_forward || "—"}</div>
                <div style={{color:"#9b9b9b"}}>Carry fwd</div>
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>
              {lt.is_paid   && <span style={{background:"#d1fae5",color:"#065f46",padding:"2px 7px",borderRadius:10,fontSize:10,border:"1px solid #6ee7b7"}}>Paid</span>}
              {!lt.is_paid  && <span style={{background:"#fee2e2",color:"#991b1b",padding:"2px 7px",borderRadius:10,fontSize:10,border:"1px solid #fca5a5"}}>Unpaid</span>}
              {lt.requires_document && <span style={{background:"#fef3c7",color:"#92400e",padding:"2px 7px",borderRadius:10,fontSize:10,border:"1px solid #fde68a"}}>Doc required</span>}
              {lt.carry_forward     && <span style={{background:"#eff6ff",color:"#1e40af",padding:"2px 7px",borderRadius:10,fontSize:10,border:"1px solid #bfdbfe"}}>Carry fwd</span>}
              {lt.allow_negative_balance && <span style={{background:"#f5f3ff",color:"#5b21b6",padding:"2px 7px",borderRadius:10,fontSize:10,border:"1px solid #ddd6fe"}}>Negative OK</span>}
            </div>
          </Card>
        ))}
        {leaveTypes.length === 0 && (
          <div style={{gridColumn:"1/-1"}}>
            <Card><EmptyState icon="🗂" title="No leave types" sub="Create your first leave type to get started." /></Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD / OVERVIEW
──────────────────────────────────────────────── */
function Dashboard({ balances, leaveTypes, myRequests }) {
  const recentRequests = useMemo(() => (myRequests || []).slice(0, 5), [myRequests]);
  const pending   = myRequests?.filter(r => r.status==="pending").length   || 0;
  const approved  = myRequests?.filter(r => r.status==="approved").length  || 0;
  const rejected  = myRequests?.filter(r => r.status==="rejected").length  || 0;
  const totalDaysLeft = balances?.reduce((a, b) => {
    const total = (b.allocated_days||0) + (b.carried_forward||0);
    return a + Math.max(0, total - (b.used_days||0));
  }, 0) || 0;

  const stats = [
    { label:"Days Available", value: totalDaysLeft.toFixed(1), icon:"🏖", color:"#e8502a" },
    { label:"Pending",        value: pending,   icon:"⏳", color:"#d97706" },
    { label:"Approved",       value: approved,  icon:"✅", color:"#10b981" },
    { label:"Rejected",       value: rejected,  icon:"❌", color:"#ef4444" },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14}}>
        {stats.map(s => (
          <Card key={s.label} style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{
              width:44,height:44,borderRadius:12,flexShrink:0,
              background:s.color+"18",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:20
            }}>{s.icon}</div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:"#1a1a1a",lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11,color:"#9b9b9b",marginTop:3}}>{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Balance Overview */}
      <div>
        <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:12}}>Leave Balance</div>
        <BalanceSection balances={balances} leaveTypes={leaveTypes} />
      </div>

      {/* Recent Requests */}
      {recentRequests.length > 0 && (
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:12}}>Recent Requests</div>
          <Card style={{padding:0,overflow:"hidden"}}>
            {recentRequests.map((req, i) => (
              <div key={req.id} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"12px 18px",
                borderBottom: i < recentRequests.length-1 ? "1px solid #f5f0ee" : "none"
              }}>
                <div style={{fontSize:13,color:"#333"}}>
                  <strong>{req.leave_type?.name || "Leave"}</strong>
                  <span style={{marginLeft:8,fontSize:11,color:"#9b9b9b"}}>{req.start_date} → {req.end_date}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#555"}}>{req.days}d</span>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT LEAVE MODULE
──────────────────────────────────────────────── */
export default function LeaveModule() {
  const auth = useMemo(() => decodeToken(), []);
  const roleLevel = auth?.level ?? 0;
  const isApprover = APPROVER_ROLES.has(auth?.role?.toLowerCase?.()) || roleLevel <= 4;
  const isAdmin    = auth?.role?.toLowerCase?.() === "admin" || roleLevel === 1;

  const [tab, setTab] = useState("dashboard");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyRefresh, setApplyRefresh] = useState(0);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [typesR, balR, myR] = await Promise.allSettled([
        fetch(API.LeaveTypes, { headers: authHeaders() }).then(r => r.json()),
        fetch(API.MyLeaveBalance, { headers: authHeaders() }).then(r => r.json()),
        fetch(API.MyLeaves + "?limit=100", { headers: authHeaders() }).then(r => r.json()),
      ]);
      setLeaveTypes(typesR.status==="fulfilled" && Array.isArray(typesR.value) ? typesR.value : []);
      setBalances(balR.status==="fulfilled" && Array.isArray(balR.value) ? balR.value : []);
      setMyRequests(myR.status==="fulfilled" && Array.isArray(myR.value) ? myR.value : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll, applyRefresh]);

  const TABS = [
    { id:"dashboard",  label:"Dashboard", icon:"⊞" },
    { id:"apply",      label:"Apply",     icon:"+" },
    { id:"my",         label:"My Leaves", icon:"📋" },
    ...(isApprover ? [{ id:"approvals",  label:"Approvals", icon:"✓" }] : []),
    ...(isAdmin    ? [{ id:"types",      label:"Leave Types", icon:"⚙" }] : []),
  ];

  return (
    <div style={{
      fontFamily:"'DM Sans',system-ui,sans-serif",
      minHeight:"100vh", background:"#f8f6f4",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        * { box-sizing: border-box; }
      `}</style>

      {/* Page Header */}
      <div style={{
        background:"#fff", borderBottom:"1px solid #f0ebe8",
        padding:"20px 28px 0", position:"sticky", top:0, zIndex:10
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{
            width:36,height:36,borderRadius:10,
            background:"linear-gradient(135deg,#e8502a,#f08450)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,flexShrink:0
          }}>🏖</div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"#1a1a1a",letterSpacing:"-0.02em"}}>Leave Management</div>
            <div style={{fontSize:11,color:"#9b9b9b"}}>Manage and track leave requests</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",gap:2}}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"9px 16px",border:"none",background:"none",
              cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500,
              color: tab===t.id ? "#e8502a" : "#6b7280",
              borderBottom: tab===t.id ? "2px solid #e8502a" : "2px solid transparent",
              marginBottom:-1, transition:"all .15s",
              borderRadius:0,
            }}>
              <span style={{fontSize:14}}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{padding:"24px 28px",maxWidth:900,margin:"0 auto"}}>
        {loading ? <Spinner /> : (
          <>
            {tab==="dashboard" && (
              <Dashboard balances={balances} leaveTypes={leaveTypes} myRequests={myRequests} />
            )}
            {tab==="apply" && (
              <ApplyLeaveForm
                leaveTypes={leaveTypes}
                onSuccess={()=>{ setApplyRefresh(r=>r+1); setTab("my"); }}
              />
            )}
            {tab==="my" && (
              <MyRequests refresh={applyRefresh} />
            )}
            {tab==="approvals" && <ApprovalPanel />}
            {tab==="types" && (
              <LeaveTypesAdmin leaveTypes={leaveTypes} onRefresh={loadAll} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
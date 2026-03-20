import React, { useState, useMemo } from "react";
import {
  X, Search, ChevronLeft, ChevronRight, Shield, Crown,
  Users, FileText, Edit3, Trash2, Eye, PlusCircle, Send,
  Tag, Building2, Calendar, CheckCircle2, XCircle, Clock,
  AlertTriangle, BookOpen, Lock, Globe, Star, Download,
  Filter, RefreshCw, ArrowLeft, TrendingUp, Award,
  ChevronDown, Pin, PinOff, ToggleLeft, ToggleRight,
  Layers, Hash,
} from "lucide-react";

/* ─── Animations ─── */
const STYLES = `
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes slideInRight { from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1} }
  .fade-in        { animation: fadeIn .22s ease-out; }
  .slide-up       { animation: slideUp .28s ease-out forwards; }
  .slide-in-right { animation: slideInRight .32s cubic-bezier(.4,0,.2,1); }
`;
if (typeof document !== "undefined") {
  const s = document.createElement("style"); s.innerHTML = STYLES;
  document.head.appendChild(s);
}

/* ─── Shared UI ─── */
function IconBadge({ icon: Icon, color }) {
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${color}`}>
      <Icon className="w-5 h-5" />
    </span>
  );
}
function Widget({ title, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-center">
      <IconBadge icon={icon} color={color} />
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
function Card({ title, children, action }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-sm font-medium text-gray-500">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Config ─── */
const CATEGORIES = ["HR Policy", "IT & Security", "Finance", "Legal", "Health & Safety", "Operations", "Code of Conduct", "Benefits"];

const CAT_CFG = {
  "HR Policy":       { color: "bg-violet-50 text-violet-700",  border: "border-violet-200", icon: Users        },
  "IT & Security":   { color: "bg-cyan-50 text-cyan-700",      border: "border-cyan-200",   icon: Lock         },
  "Finance":         { color: "bg-green-50 text-green-700",    border: "border-green-200",  icon: Building2    },
  "Legal":           { color: "bg-red-50 text-red-700",        border: "border-red-200",    icon: Shield       },
  "Health & Safety": { color: "bg-orange-50 text-orange-700",  border: "border-orange-200", icon: AlertTriangle},
  "Operations":      { color: "bg-blue-50 text-blue-700",      border: "border-blue-200",   icon: Layers       },
  "Code of Conduct": { color: "bg-gray-50 text-gray-700",      border: "border-gray-200",   icon: Award        },
  "Benefits":        { color: "bg-amber-50 text-amber-700",    border: "border-amber-200",  icon: Star         },
};

const STATUS_CFG = {
  Active:   { badge: "bg-green-100 text-green-800",   dot: "bg-green-500",  icon: CheckCircle2 },
  Draft:    { badge: "bg-gray-100 text-gray-600",     dot: "bg-gray-400",   icon: Clock        },
  Archived: { badge: "bg-red-100 text-red-700",       dot: "bg-red-400",    icon: XCircle      },
  Review:   { badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400", icon: AlertTriangle},
};

const AUDIENCES = ["All Employees", "HR", "Engineering", "Finance", "Sales", "Design", "Operations", "Management", "IT"];

const VIEWER_NAMES = ["Khalid Al-Mansouri", "Aisha Khan", "Sara Ali"];

/* ─── Seed policies ─── */
const SEED_POLICIES = [
  {
    id: "pol-001", title: "Annual Leave Policy",
    category: "HR Policy", status: "Active", audience: "All Employees",
    version: "v3.2", mandatory: true, pinned: true,
    createdBy: "Aisha Khan", createdDate: "2025-01-15", updatedDate: "2026-01-10",
    ackCount: 48, totalRecipients: 50,
    summary: "Defines the annual leave entitlement, application process, carry-forward rules, and encashment guidelines for all employees.",
    content: `1. Entitlement\nAll permanent employees are entitled to 21 working days of annual leave per calendar year. Probationary employees are entitled to 14 days.\n\n2. Application Process\nLeave applications must be submitted through the HRMS portal at least 5 working days in advance. Emergency leave requests should be communicated to the line manager immediately.\n\n3. Carry-Forward Rules\nA maximum of 7 days can be carried forward to the next calendar year. Any remaining balance beyond 7 days will be forfeited.\n\n4. Leave Encashment\nEmployees may encash up to 10 days of unused leave per year, subject to management approval and departmental requirements.\n\n5. Public Holidays\nPublic holidays are not counted as part of annual leave. The approved public holiday list is published at the beginning of each year.`,
  },
  {
    id: "pol-002", title: "Remote Work & WFH Policy",
    category: "HR Policy", status: "Active", audience: "All Employees",
    version: "v2.0", mandatory: true, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2024-06-01", updatedDate: "2025-11-20",
    ackCount: 42, totalRecipients: 50,
    summary: "Governs eligibility, frequency, and expectations for work-from-home arrangements.",
    content: `1. Eligibility\nEmployees who have completed their probation period and received a satisfactory performance rating are eligible for WFH.\n\n2. Frequency\nA maximum of 2 WFH days per week are permitted. Department heads may approve additional days on a case-by-case basis.\n\n3. Expectations\nEmployees working from home must maintain regular working hours, attend all scheduled meetings, and be reachable on all communication platforms.\n\n4. Equipment\nThe company does not provide home office equipment. Employees are responsible for their own internet connectivity.`,
  },
  {
    id: "pol-003", title: "Information Security Policy",
    category: "IT & Security", status: "Active", audience: "All Employees",
    version: "v4.1", mandatory: true, pinned: true,
    createdBy: "Sara Ali", createdDate: "2023-03-10", updatedDate: "2026-02-01",
    ackCount: 50, totalRecipients: 50,
    summary: "Outlines data handling, password management, device security, and incident reporting requirements.",
    content: `1. Password Policy\nAll passwords must be at least 12 characters, include upper/lowercase letters, numbers, and special characters. Passwords must be changed every 90 days. Two-factor authentication is mandatory for all systems.\n\n2. Data Classification\nData is classified as Public, Internal, Confidential, or Restricted. Each classification has specific handling and sharing requirements.\n\n3. Device Security\nAll company devices must have endpoint protection installed. Employees must lock their devices when unattended.\n\n4. Incident Reporting\nAny suspected security breach must be reported to IT within 1 hour of discovery.`,
  },
  {
    id: "pol-004", title: "Expense Reimbursement Policy",
    category: "Finance", status: "Active", audience: "All Employees",
    version: "v2.5", mandatory: true, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2024-01-01", updatedDate: "2025-12-01",
    ackCount: 38, totalRecipients: 50,
    summary: "Covers eligible expenses, claim limits, submission deadlines, and approval workflows.",
    content: `1. Eligible Expenses\nTravel, accommodation, meals during business travel, client entertainment, and approved training costs are reimbursable.\n\n2. Claim Limits\nMeals: PKR 2,500/day. Accommodation: PKR 15,000/night. Local transport: Actual cost with receipt.\n\n3. Submission Process\nAll claims must be submitted within 30 days of the expense date with original receipts attached.\n\n4. Approval Workflow\nClaims up to PKR 10,000 require line manager approval. Above PKR 10,000 requires Finance department approval.`,
  },
  {
    id: "pol-005", title: "Anti-Harassment & Workplace Conduct",
    category: "Code of Conduct", status: "Active", audience: "All Employees",
    version: "v1.8", mandatory: true, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2022-05-01", updatedDate: "2025-08-15",
    ackCount: 49, totalRecipients: 50,
    summary: "Defines acceptable workplace behavior, harassment reporting procedures, and disciplinary actions.",
    content: `1. Zero Tolerance Policy\nThe company maintains a zero-tolerance policy toward harassment, bullying, discrimination, and workplace violence in any form.\n\n2. Reporting\nEmployees may report incidents through the HR portal, directly to HR, or via the anonymous ethics hotline.\n\n3. Investigation Process\nAll reported incidents are investigated within 10 business days. Confidentiality is maintained throughout.\n\n4. Consequences\nViolations may result in disciplinary action up to and including termination, regardless of seniority.`,
  },
  {
    id: "pol-006", title: "Health & Safety Guidelines",
    category: "Health & Safety", status: "Active", audience: "All Employees",
    version: "v3.0", mandatory: true, pinned: false,
    createdBy: "Sara Ali", createdDate: "2021-01-01", updatedDate: "2025-06-01",
    ackCount: 44, totalRecipients: 50,
    summary: "Emergency procedures, workplace safety standards, and employee wellbeing requirements.",
    content: `1. Emergency Procedures\nFire exits must be kept clear at all times. Employees must participate in all scheduled drills.\n\n2. Incident Reporting\nAll workplace injuries, near-misses, and unsafe conditions must be reported to the Safety Officer within 24 hours.\n\n3. Personal Protective Equipment\nPPE must be worn in designated areas. The company provides required PPE at no cost.\n\n4. Mental Health\nEmployee Assistance Programs are available 24/7. Mental health days are encouraged and supported.`,
  },
  {
    id: "pol-007", title: "Travel & Business Trip Policy",
    category: "Operations", status: "Active", audience: "All Employees",
    version: "v2.2", mandatory: false, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2024-03-01", updatedDate: "2025-10-01",
    ackCount: 25, totalRecipients: 50,
    summary: "Requirements for booking, approval, and reimbursement of domestic and international business travel.",
    content: `1. Approval\nAll business travel must be approved by the department head at least 3 business days in advance.\n\n2. Booking\nTravel must be booked through the approved travel portal. Economy class for flights under 6 hours; business class for longer flights.\n\n3. Per Diem\nDomestic: PKR 5,000/day. International: USD 75/day for Middle East; USD 100/day for other regions.`,
  },
  {
    id: "pol-008", title: "Employee Benefits & Perks",
    category: "Benefits", status: "Active", audience: "All Employees",
    version: "v1.5", mandatory: false, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2025-02-01", updatedDate: "2026-01-01",
    ackCount: 47, totalRecipients: 50,
    summary: "Overview of health insurance, provident fund, loans, and other employee benefits.",
    content: `1. Health Insurance\nAll permanent employees and their immediate family members are covered under the company health plan.\n\n2. Provident Fund\nCompany contributes 8% of basic salary to the provident fund. Employee contribution is 8%.\n\n3. Salary Advance\nEmployees may request up to 1 month salary advance after 6 months of service, repayable in 3 installments.\n\n4. Training & Development\nA personal development budget of PKR 50,000 per year is available for approved courses and certifications.`,
  },
  {
    id: "pol-009", title: "Performance Review Process",
    category: "HR Policy", status: "Active", audience: "All Employees",
    version: "v2.1", mandatory: true, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2023-11-01", updatedDate: "2025-12-15",
    ackCount: 41, totalRecipients: 50,
    summary: "Annual and mid-year review cycles, KPIs, rating scales, and promotion criteria.",
    content: `1. Review Cycle\nAnnual reviews are conducted in March. Mid-year check-ins are held in September.\n\n2. Rating Scale\n5-point scale: Outstanding, Exceeds Expectations, Meets Expectations, Needs Improvement, Unsatisfactory.\n\n3. KPI Setting\nKPIs are set collaboratively at the start of each year and reviewed quarterly.\n\n4. Promotion\nPromotion decisions are based on a minimum of 2 consecutive Exceeds Expectations ratings and a vacancy or business need.`,
  },
  {
    id: "pol-010", title: "Data Privacy Policy (GDPR-Aligned)",
    category: "Legal", status: "Active", audience: "All Employees",
    version: "v3.0", mandatory: true, pinned: false,
    createdBy: "Sara Ali", createdDate: "2022-05-25", updatedDate: "2025-05-25",
    ackCount: 46, totalRecipients: 50,
    summary: "Employee and customer data handling obligations, rights, and breach notification procedures.",
    content: `1. Data Collection\nOnly data necessary for business operations is collected. Collection purposes are clearly communicated.\n\n2. Data Storage\nPersonal data is stored securely and accessed only by authorized personnel.\n\n3. Employee Rights\nEmployees have the right to access, correct, and request deletion of their personal data.\n\n4. Breach Response\nData breaches must be reported to the Data Protection Officer within 72 hours of discovery.`,
  },
  {
    id: "pol-011", title: "Social Media & Public Communication Policy",
    category: "Code of Conduct", status: "Review", audience: "All Employees",
    version: "v1.2", mandatory: false, pinned: false,
    createdBy: "Sara Ali", createdDate: "2024-08-01", updatedDate: "2025-12-01",
    ackCount: 12, totalRecipients: 50,
    summary: "Guidelines for representing the company on social media and in public communications.",
    content: `1. Personal Accounts\nEmployees sharing company-related content on personal accounts must clearly state that views are their own.\n\n2. Confidential Information\nConfidential business information must never be shared on any social media platform.\n\n3. Official Communications\nOnly designated spokespersons may make official statements on behalf of the company.`,
  },
  {
    id: "pol-012", title: "Disciplinary Action Procedure",
    category: "HR Policy", status: "Active", audience: "All Employees",
    version: "v2.0", mandatory: true, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2022-01-01", updatedDate: "2025-09-01",
    ackCount: 39, totalRecipients: 50,
    summary: "Formal process for managing employee misconduct including verbal warnings, show cause, and termination.",
    content: `1. Verbal Warning\nThe first step for minor infractions. Documented but not placed in the formal HR file.\n\n2. Written Warning\nFor repeated or more serious infractions. Placed in the HR file and active for 12 months.\n\n3. Show Cause Notice\nFor serious misconduct. Employee must respond within 3 business days.\n\n4. Termination\nFor gross misconduct or after exhausting previous steps. Final payment is processed within 30 days.`,
  },
  {
    id: "pol-013", title: "IT Asset Management Policy",
    category: "IT & Security", status: "Active", audience: "All Employees",
    version: "v1.3", mandatory: false, pinned: false,
    createdBy: "Sara Ali", createdDate: "2024-04-01", updatedDate: "2025-07-01",
    ackCount: 33, totalRecipients: 50,
    summary: "Rules for using, returning, and maintaining company-issued IT equipment.",
    content: `1. Asset Allocation\nIT assets are allocated based on role requirements. Employees must sign an asset receipt form.\n\n2. Usage\nCompany devices are for business use. Limited personal use is permitted provided it does not impact productivity.\n\n3. Return\nAll assets must be returned in good condition within 3 days of separation. Damage beyond normal wear will be charged.`,
  },
  {
    id: "pol-014", title: "Recruitment & Hiring Policy",
    category: "HR Policy", status: "Draft", audience: "HR",
    version: "v1.0", mandatory: false, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2026-02-01", updatedDate: "2026-02-28",
    ackCount: 0, totalRecipients: 5,
    summary: "End-to-end hiring process including sourcing, interviewing, offer approval, and onboarding SLAs.",
    content: `1. Job Requisition\nAll new hires require a signed Job Requisition Form approved by the department head and HR Head.\n\n2. Sourcing\nPreference is given to internal candidates. External sourcing via job portals and approved agencies.\n\n3. Interview Process\nMinimum 2 rounds: HR screening followed by technical/competency interview with the hiring manager.\n\n4. Offer Approval\nOffers above the approved band require CFO and CEO approval.`,
  },
  {
    id: "pol-015", title: "Probation Period Policy",
    category: "HR Policy", status: "Active", audience: "All Employees",
    version: "v1.4", mandatory: true, pinned: false,
    createdBy: "Aisha Khan", createdDate: "2023-05-01", updatedDate: "2025-04-01",
    ackCount: 40, totalRecipients: 50,
    summary: "Conditions, evaluation criteria, and confirmation process for new employees during probation.",
    content: `1. Duration\nThe standard probation period is 3 months, extendable by up to 3 months at management discretion.\n\n2. Evaluation\nProbationers are reviewed at the 1-month and 3-month marks against defined KPIs.\n\n3. Confirmation\nSuccessful completion results in permanent employment confirmation in writing.\n\n4. Termination During Probation\nEither party may terminate employment during probation with 7 days notice.`,
  },
];

/* ─── Policy Form Modal ─── */
const EMPTY_FORM = {
  title: "", category: "HR Policy", status: "Draft",
  audience: "All Employees", version: "v1.0",
  mandatory: false, pinned: false, summary: "", content: "",
};

function PolicyFormModal({ policy, onClose, onSave, currentUser }) {
  const isEdit = !!policy;
  const [form, setForm] = useState(isEdit ? { ...policy } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState("details");

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title   = "Required";
    if (!form.summary.trim()) e.summary = "Required";
    if (!form.content.trim()) e.content = "Required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
    onClose();
  };

  const CatIcon = CAT_CFG[form.category]?.icon || FileText;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[94vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${CAT_CFG[form.category]?.color} ${CAT_CFG[form.category]?.border}`}>
              <CatIcon size={15} />
            </div>
            <span className="font-semibold text-gray-900 text-sm">{isEdit ? "Edit Policy" : "Create New Policy"}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {[["details", "Details"], ["content", "Policy Content"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition ${tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "details" ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Policy Title *</label>
                <input type="text" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Annual Leave Policy"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition ${errors.title ? "border-red-300" : "border-gray-200"}`} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 cursor-pointer transition">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => set("status", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 cursor-pointer transition">
                    {["Active", "Draft", "Review", "Archived"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Target Audience</label>
                  <select value={form.audience} onChange={e => set("audience", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 cursor-pointer transition">
                    {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Version</label>
                  <input type="text" value={form.version} onChange={e => set("version", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition" />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "mandatory", label: "Mandatory Policy", desc: "Requires acknowledgement" },
                  { key: "pinned",    label: "Pin Policy",       desc: "Show at top of list"      },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                    <button onClick={() => set(key, !form[key])}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form[key] ? "bg-blue-600" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Summary / Description *</label>
                <textarea rows={3} value={form.summary} onChange={e => set("summary", e.target.value)}
                  placeholder="Brief description visible in the policy list…"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none transition ${errors.summary ? "border-red-300" : "border-gray-200"}`} />
                {errors.summary && <p className="text-xs text-red-500 mt-1">{errors.summary}</p>}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Full Policy Content *</label>
              <textarea rows={18} value={form.content} onChange={e => set("content", e.target.value)}
                placeholder="Write the full policy content here. Use numbered sections for clarity…"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none transition font-mono text-xs leading-relaxed ${errors.content ? "border-red-300" : "border-gray-200"}`} />
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
              <div className="text-right text-xs text-gray-400 mt-1">{form.content.length} chars</div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            <Send size={14} /> {isEdit ? "Save Changes" : "Publish Policy"}
          </button>
          <button onClick={onClose} className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Policy Detail Sidebar ─── */
function PolicySidebar({ policy, onClose, onEdit, onDelete, onTogglePin, onToggleStatus }) {
  if (!policy) return null;
  const stCfg  = STATUS_CFG[policy.status];
  const catCfg = CAT_CFG[policy.category] || {};
  const CatIcon = catCfg.icon || FileText;
  const ackPct  = Math.round((policy.ackCount / policy.totalRecipients) * 100);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[51] w-full sm:w-[480px] bg-white shadow-2xl flex flex-col slide-in-right">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${catCfg.color}`}>{policy.category}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${stCfg?.badge}`}>
                {React.createElement(stCfg?.icon, { size: 11 })} {policy.status}
              </span>
              {policy.mandatory && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Mandatory</span>}
              {policy.pinned    && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1"><Pin size={9}/> Pinned</span>}
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">{policy.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{policy.version} · Updated {policy.updatedDate}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Category",  value: policy.category },
              { label: "Audience",  value: policy.audience },
              { label: "Created By",value: policy.createdBy },
              { label: "Created",   value: policy.createdDate },
              { label: "Last Updated", value: policy.updatedDate },
              { label: "Version",   value: policy.version },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{label}</div>
                <div className="text-sm font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Summary</div>
            <p className="text-sm text-gray-700 leading-relaxed">{policy.summary}</p>
          </div>

          {/* Acknowledgement */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Acknowledgements</div>
              <span className="text-sm font-semibold text-gray-900">{policy.ackCount}/{policy.totalRecipients}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-500 ${ackPct>=80?"bg-emerald-500":ackPct>=50?"bg-blue-500":"bg-amber-400"}`}
                style={{ width: `${ackPct}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1.5">{ackPct}% of recipients acknowledged</div>
          </div>

          {/* Content preview */}
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Policy Content</div>
            <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{policy.content}</pre>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-wrap">
          <button onClick={() => { onEdit(policy); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
            <Edit3 size={13} /> Edit
          </button>
          <button onClick={() => { onTogglePin(policy.id); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-xl transition">
            {policy.pinned ? <><PinOff size={13}/> Unpin</> : <><Pin size={13}/> Pin</>}
          </button>
          <button onClick={() => { onToggleStatus(policy.id); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
            {policy.status === "Active" ? <><ToggleLeft size={13}/> Archive</> : <><ToggleRight size={13}/> Activate</>}
          </button>
          <button onClick={() => { onDelete(policy); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition">
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition text-center min-w-[60px]">Close</button>
        </div>
      </div>
    </>
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirm({ policy, onConfirm, onCancel }) {
  if (!policy) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[calc(100vw-32px)] shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Policy?</h2>
        <p className="text-sm text-gray-500 text-center mb-1">This will permanently remove:</p>
        <p className="text-sm font-medium text-gray-800 text-center mb-2 px-4">"{policy.title}"</p>
        <p className="text-xs text-gray-400 text-center mb-5">{policy.version} · {policy.category}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Policy Row ─── */
function PolicyRow({ policy, idx, onView, onEdit, onDelete, onTogglePin }) {
  const stCfg  = STATUS_CFG[policy.status];
  const catCfg = CAT_CFG[policy.category] || {};
  const CatIcon = catCfg.icon || FileText;
  const ackPct  = Math.round((policy.ackCount / policy.totalRecipients) * 100);

  return (
    <tr className={`${idx%2===0?"bg-white":"bg-gray-50/60"} hover:bg-blue-50/20 transition border-b border-gray-50 last:border-b-0`}>
      <td className="py-3 px-4 cursor-pointer max-w-xs" onClick={onView}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${catCfg.color} ${catCfg.border}`}>
            <CatIcon size={13} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {policy.pinned && <Pin size={11} className="text-blue-500 flex-shrink-0" />}
              {policy.mandatory && <span className="text-[10px] font-bold text-red-600">★</span>}
              <span className="text-sm font-medium text-gray-800 line-clamp-1">{policy.title}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{policy.summary.substring(0,60)}…</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${catCfg.color}`}>{policy.category}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${stCfg?.badge}`}>
          {React.createElement(stCfg?.icon, { size: 11 })} {policy.status}
        </span>
      </td>
      <td className="py-3 px-4 text-center text-xs text-gray-500 whitespace-nowrap">{policy.audience}</td>
      <td className="py-3 px-4 text-center text-xs font-medium text-gray-600">{policy.version}</td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${ackPct>=80?"bg-emerald-500":ackPct>=50?"bg-blue-500":"bg-amber-400"}`} style={{ width: `${ackPct}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-600 tabular-nums whitespace-nowrap">{policy.ackCount}/{policy.totalRecipients}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">{policy.updatedDate}</td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={onView}        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition" title="View"><Eye size={13}/></button>
          <button onClick={() => onEdit(policy)}   className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition" title="Edit"><Edit3 size={13}/></button>
          <button onClick={() => onTogglePin(policy.id)} className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${policy.pinned?"border-blue-200 text-blue-500 bg-blue-50":"border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-500"}`} title="Pin"><Pin size={13}/></button>
          <button onClick={() => onDelete(policy)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition" title="Delete"><Trash2 size={13}/></button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Main Page ─── */
export default function AdminPolicyPage() {
  const today = "2026-03-05";

  const [policies, setPolicies]         = useState(SEED_POLICIES);
  const [search, setSearch]             = useState("");
  const [filterCat, setFilterCat]       = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAudience, setFilterAudience] = useState("All");
  const [filterMandatory, setFilterMandatory] = useState("All");
  const [page, setPage]                 = useState(1);
  const [viewPolicy, setViewPolicy]     = useState(null);
  const [editPolicy, setEditPolicy]     = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const PAGE_SIZE = 10;

  /* Stats */
  const stats = useMemo(() => ({
    total:     policies.length,
    active:    policies.filter(p => p.status === "Active").length,
    draft:     policies.filter(p => p.status === "Draft").length,
    review:    policies.filter(p => p.status === "Review").length,
    archived:  policies.filter(p => p.status === "Archived").length,
    mandatory: policies.filter(p => p.mandatory).length,
    avgAck:    Math.round(policies.reduce((s,p) => s + Math.round((p.ackCount/p.totalRecipients)*100), 0) / policies.length),
  }), [policies]);

  /* Category breakdown */
  const catBreakdown = useMemo(() => {
    const map = {};
    policies.forEach(p => { map[p.category] = (map[p.category]||0) + 1; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [policies]);

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...policies]
      .sort((a,b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedDate) - new Date(a.updatedDate);
      })
      .filter(p =>
        (!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.createdBy.toLowerCase().includes(q)) &&
        (filterCat       === "All" || p.category  === filterCat) &&
        (filterStatus    === "All" || p.status    === filterStatus) &&
        (filterAudience  === "All" || p.audience  === filterAudience) &&
        (filterMandatory === "All" || (filterMandatory === "Mandatory" ? p.mandatory : !p.mandatory))
      );
  }, [search, filterCat, filterStatus, filterAudience, filterMandatory, policies]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const setFilter  = fn => { fn(); setPage(1); };

  const activeFilters = [
    filterCat       !== "All" && { key: "cat",       label: filterCat },
    filterStatus    !== "All" && { key: "status",    label: filterStatus },
    filterAudience  !== "All" && { key: "audience",  label: filterAudience },
    filterMandatory !== "All" && { key: "mandatory", label: filterMandatory },
    search                    && { key: "q",         label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key==="cat")       setFilterCat("All");
    if (key==="status")    setFilterStatus("All");
    if (key==="audience")  setFilterAudience("All");
    if (key==="mandatory") setFilterMandatory("All");
    if (key==="q")         setSearch("");
  };

  /* CRUD */
  const handleCreate = data => {
    setPolicies(prev => [{
      ...data, id: `pol-${Date.now()}`,
      createdBy: "Aisha Khan", createdDate: today, updatedDate: today,
      ackCount: 0, totalRecipients: data.audience === "All Employees" ? 50 : 10,
    }, ...prev]);
  };

  const handleEdit = data => {
    setPolicies(prev => prev.map(p => p.id === editPolicy.id ? { ...p, ...data, updatedDate: today } : p));
    setEditPolicy(null);
  };

  const handleDelete = id => { setPolicies(prev => prev.filter(p => p.id !== id)); setDeleteTarget(null); };
  const handleTogglePin = id => setPolicies(prev => prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  const handleToggleStatus = id => setPolicies(prev => prev.map(p =>
    p.id === id ? { ...p, status: p.status === "Active" ? "Archived" : "Active", updatedDate: today } : p
  ));

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Policy Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, manage & track company-wide policies · {new Date(today).toDateString()}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm whitespace-nowrap self-start">
          <PlusCircle size={16} /> New Policy
        </button>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Widget title="Total Policies"  value={stats.total}     sub="All records"           icon={FileText}    color="border-blue-300 bg-blue-50 text-blue-700"      />
        <Widget title="Active"          value={stats.active}    sub="Published"             icon={CheckCircle2} color="border-green-300 bg-green-50 text-green-700"  />
        <Widget title="Mandatory"       value={stats.mandatory} sub="Require acknowledgement" icon={AlertTriangle} color="border-red-300 bg-red-50 text-red-700"     />
        <Widget title="Avg. Ack Rate"   value={`${stats.avgAck}%`} sub="Across all policies" icon={TrendingUp}  color="border-violet-300 bg-violet-50 text-violet-700" />
      </div>

      {/* Status pills row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Active",   val: stats.active,   color: "bg-green-50 text-green-700 border-green-200"  },
          { label: "Draft",    val: stats.draft,    color: "bg-gray-100 text-gray-600 border-gray-200"    },
          { label: "In Review",val: stats.review,   color: "bg-yellow-50 text-yellow-700 border-yellow-200"},
          { label: "Archived", val: stats.archived, color: "bg-red-50 text-red-600 border-red-200"        },
        ].map(({ label, val, color }) => (
          <button key={label}
            onClick={() => setFilter(() => setFilterStatus(filterStatus === label.replace("In ","") ? "All" : label.replace("In ","")))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition shadow-sm ${color} hover:shadow-md`}>
            <span className="text-lg font-bold">{val}</span>
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Analytics: category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title="Policies by Category" action={<span className="text-xs text-gray-400">click to filter</span>}>
          <div className="space-y-2.5">
            {catBreakdown.map(([cat, count]) => {
              const CatIcon = CAT_CFG[cat]?.icon || FileText;
              const pct    = Math.round((count / stats.total) * 100);
              const active = filterCat === cat;
              return (
                <div key={cat} onClick={() => setFilter(() => setFilterCat(active ? "All" : cat))}
                  className={`flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 group transition ${active?"bg-blue-50":"hover:bg-gray-50"}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border ${CAT_CFG[cat]?.color} ${CAT_CFG[cat]?.border}`}>
                    <CatIcon size={11} />
                  </div>
                  <span className={`w-28 text-xs font-medium truncate flex-shrink-0 transition ${active?"text-blue-700":"text-gray-600 group-hover:text-blue-600"}`}>{cat}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${active?"bg-blue-600":"bg-blue-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Acknowledgement Overview">
          <div className="space-y-2.5">
            {policies
              .filter(p => p.status === "Active")
              .sort((a,b) => (a.ackCount/a.totalRecipients) - (b.ackCount/b.totalRecipients))
              .slice(0,7)
              .map(p => {
                const pct = Math.round((p.ackCount/p.totalRecipients)*100);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 truncate flex-shrink-0 w-36">{p.title.substring(0,24)}…</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all ${pct>=80?"bg-emerald-500":pct>=50?"bg-blue-400":"bg-amber-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 tabular-nums w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setFilter(() => setSearch(e.target.value))}
            placeholder="Search policies…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400" />
        </div>
        {[
          { val: filterCat,      set: setFilterCat,      ph: "All Categories", opts: CATEGORIES },
          { val: filterStatus,   set: setFilterStatus,   ph: "All Statuses",   opts: ["Active","Draft","Review","Archived"] },
          { val: filterAudience, set: setFilterAudience, ph: "All Audiences",  opts: AUDIENCES },
          { val: filterMandatory,set: setFilterMandatory,ph: "All Types",       opts: ["Mandatory","Optional"] },
        ].map(({ val, set, ph, opts }) => (
          <select key={ph} value={val} onChange={e => setFilter(() => set(e.target.value))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
            <option value="All">{ph}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {activeFilters.length > 0 && (
          <button onClick={() => { setSearch(""); setFilterCat("All"); setFilterStatus("All"); setFilterAudience("All"); setFilterMandatory("All"); setPage(1); }}
            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition whitespace-nowrap">
            Clear all
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} polic{filtered.length!==1?"ies":"y"}</span>
      </div>

      {/* Active pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
              {f.label}
              <button className="opacity-60 hover:opacity-100 transition" onClick={() => clearFilter(f.key)}><X size={10}/></button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <Card title="All Policies" action={<span className="text-xs text-gray-400">{filtered.length} polic{filtered.length!==1?"ies":"y"}</span>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Policy","Category","Status","Audience","Version","Ack Rate","Updated","Actions"].map((h,i)=>(
                  <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${i===0?"text-left":"text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <FileText size={30} className="mx-auto mb-3 text-gray-300"/>
                  <p className="text-sm text-gray-400">No policies found.</p>
                  <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-blue-600 font-medium hover:underline">+ Create first policy</button>
                </td></tr>
              ) : paginated.map((p,i) => (
                <PolicyRow
                  key={p.id} policy={p} idx={i}
                  onView={() => setViewPolicy(p)}
                  onEdit={pol => setEditPolicy(pol)}
                  onDelete={pol => setDeleteTarget(pol)}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 text-sm">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              <ChevronLeft size={14}/> Previous
            </button>
            <span className="text-xs text-gray-500">
              Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}
            </span>
            <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              Next <ChevronRight size={14}/>
            </button>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showCreate  && <PolicyFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {editPolicy  && <PolicyFormModal policy={editPolicy} onClose={() => setEditPolicy(null)} onSave={handleEdit} />}
      {viewPolicy  && (
        <PolicySidebar
          policy={viewPolicy}
          onClose={() => setViewPolicy(null)}
          onEdit={p => { setViewPolicy(null); setEditPolicy(p); }}
          onDelete={p => { setViewPolicy(null); setDeleteTarget(p); }}
          onTogglePin={handleTogglePin}
          onToggleStatus={handleToggleStatus}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          policy={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* Helper to get auth headers with Bearer token */
function getHeaders() {
  const t = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

/* Helper to extract employee full name */
function getEmployeeName(emp) {
  if (!emp) return "Unknown";
  if (emp.employee_name) return emp.employee_name;
  if (emp.f_name || emp.l_name)
    return `${emp.f_name || ""} ${emp.l_name || ""}`.trim();
  return "Unknown";
}

function LeadDashboard() {
  const [team, setTeam] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ─────────────────────────────
     Fetch Team Employees
  ───────────────────────────── */
  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(API.GetAllEmployees, { headers: getHeaders() });
      if (!res.ok) throw new Error(`Failed to fetch team: ${res.status}`);
      const data = await res.json();
      setTeam(Array.isArray(data) ? data : data?.employees || []);
      setError(null);
    } catch (err) {
      console.error("Fetch team error:", err);
      setTeam([]);
      setError(err.message);
    }
  }, []);

  /* ─────────────────────────────
     Fetch Applications (Pending for HOD)
  ───────────────────────────── */
  const fetchPendingApps = useCallback(async () => {
    try {
      const res = await fetch(API.GetAllApplications + "?status=Pending", {
        headers: getHeaders(),
      });
      if (!res.ok)
        throw new Error(`Failed to fetch applications: ${res.status}`);
      const data = await res.json();
      setPendingApps(Array.isArray(data) ? data : data?.applications || []);
      setError(null);
    } catch (err) {
      console.error("Fetch applications error:", err);
      setPendingApps([]);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTeam(), fetchPendingApps()]).finally(() =>
      setLoading(false),
    );
  }, [fetchTeam, fetchPendingApps]);

  /* ─────────────────────────────
     HOD Actions (Approve / Reject)
  ───────────────────────────── */
  const handleAction = async (id, action) => {
    try {
      const res = await fetch(API.HODAction(id), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ action }), // "approve" | "reject"
      });
      if (res.ok) {
        fetchPendingApps(); // refresh
      }
    } catch (err) {
      console.error("Action error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="ed-page p-6 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lead Dashboard 👨‍💼</h1>
        <p className="text-sm text-gray-400">Manage your team & approvals</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="ed-card p-4 flex items-center gap-3">
          <Users />
          <div>
            <p className="text-xs text-gray-400">Team Members</p>
            <h2 className="text-xl font-bold">{team.length}</h2>
          </div>
        </div>

        <div className="ed-card p-4 flex items-center gap-3">
          <Clock />
          <div>
            <p className="text-xs text-gray-400">Pending Approvals</p>
            <h2 className="text-xl font-bold">{pendingApps.length}</h2>
          </div>
        </div>

        <div className="ed-card p-4 flex items-center gap-3">
          <CheckCircle2 />
          <div>
            <p className="text-xs text-gray-400">Approved Today</p>
            <h2 className="text-xl font-bold">—</h2>
          </div>
        </div>

        <div className="ed-card p-4 flex items-center gap-3">
          <ShieldCheck />
          <div>
            <p className="text-xs text-gray-400">Your Role</p>
            <h2 className="text-xl font-bold">Lead</h2>
          </div>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="ed-card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">
          Pending Applications (Your Approval)
        </h2>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="ed-spin" />
          </div>
        ) : pendingApps?.length === 0 ? (
          <p className="text-sm text-gray-400">No pending requests 🎉</p>
        ) : (
          <div className="space-y-3">
            {pendingApps.map((app) => (
              <div
                key={app.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {getEmployeeName(app)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {app?.type} • {app?.from_date} → {app?.to_date}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(app.id, "approve")}
                    className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleAction(app.id, "reject")}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Team List */}
      <div className="ed-card p-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-4">Your Team</h2>

        {team.length === 0 ? (
          <p className="text-sm text-gray-400">No team members found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {team.map((emp) => (
              <div
                key={emp?.id}
                className="p-3 border rounded-lg flex justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {getEmployeeName(emp)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {emp?.designation ||
                      (typeof emp?.role === "object"
                        ? emp?.role?.name
                        : emp?.role) ||
                      "—"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    emp?.employment_status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {emp?.employment_status || "Active"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadDashboard;

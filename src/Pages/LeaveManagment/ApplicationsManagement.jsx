import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  X,
  Calendar,
  Users,
  FileText,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Ban,
  MessageSquare,
  Send,
  Trash2,
  Eye,
  LayoutDashboard,
  ListChecks,
  Settings,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Auth ─── */
function getHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ─── Helpers ─── */
const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const getDays = (from, to) => {
  const d = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
  return d <= 0 ? 1 : d;
};

/* ─── Config ─── */
const STATUS_CONFIG = {
  PENDING: {
    badge: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    dot: "bg-yellow-400",
    icon: Clock,
  },
  APPROVED: {
    badge: "bg-green-100 text-green-800 border border-green-200",
    dot: "bg-green-500",
    icon: CheckCircle2,
  },
  REJECTED: {
    badge: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
    icon: X,
  },
};

/* ─── Toast ─── */
function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none ${
        type === "error" ? "bg-red-600" : "bg-emerald-600"
      }`}
    >
      {type === "error" ? (
        <AlertCircle size={15} />
      ) : (
        <CheckCircle2 size={15} />
      )}
      {msg}
    </div>
  );
}

/* ─── Application Detail Modal ─── */
function ApplicationDetailModal({
  application,
  onClose,
  onApprove,
  onReject,
  approving,
  rejecting,
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!application) return null;

  const statusCfg = STATUS_CONFIG[application.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const days = getDays(application.start_date, application.end_date);

  const handleReject = () => {
    onReject(application.id, rejectReason);
    setRejectReason("");
    setShowRejectForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusCfg.badge}`}
            >
              <StatusIcon size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Application #{application.id}
              </h2>
              <p className="text-xs text-gray-500">
                {application.employee?.name || "Unknown Employee"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Status */}
          <div className={`${statusCfg.badge} rounded-lg px-3 py-2`}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-1 opacity-70">
              Status
            </p>
            <p className="text-sm font-bold">{application.status}</p>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-1">
                Employee
              </p>
              <p className="text-sm font-medium text-gray-900">
                {application.employee?.name || "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-1">
                Department
              </p>
              <p className="text-sm font-medium text-gray-900">
                {application.employee?.department?.name || "—"}
              </p>
            </div>
          </div>

          {/* Leave Type */}
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-1">
              Leave Type
            </p>
            <p className="text-sm font-medium text-gray-900">
              {application.leave_type?.name || "—"}
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-1">
                From
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(application.start_date)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-1">
                To
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(application.end_date)}
              </p>
            </div>
          </div>

          {/* Days */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <p className="text-xs uppercase tracking-widest font-semibold text-blue-600 mb-1">
              Days Requested
            </p>
            <p className="text-lg font-bold text-blue-900">
              {days} day{days !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-1">
              Reason
            </p>
            <p className="text-sm text-gray-700">{application.reason || "—"}</p>
          </div>

          {/* Submitted */}
          <div className="bg-gray-50 rounded-lg px-3 py-2.5">
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-1">
              Submitted
            </p>
            <p className="text-sm text-gray-600">
              {formatDate(application.created_at)}
            </p>
          </div>

          {/* Rejection Reason */}
          {application.status === "REJECTED" &&
            application.rejection_reason && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <p className="text-xs uppercase tracking-widest font-semibold text-red-700 mb-1">
                  Rejection Reason
                </p>
                <p className="text-sm text-red-900">
                  {application.rejection_reason}
                </p>
              </div>
            )}

          {/* Rejection Form */}
          {showRejectForm && application.status === "PENDING" && (
            <div className="border-t pt-4 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest font-semibold text-gray-600 mb-2 block">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-sm bg-red-50 outline-none focus:border-red-400 transition resize-none h-20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || rejecting}
                  className="flex-1 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {rejecting && <Loader2 size={13} className="animate-spin" />}
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
          {application.status === "PENDING" && (
            <>
              <button
                onClick={() =>
                  showRejectForm
                    ? setShowRejectForm(false)
                    : setShowRejectForm(true)
                }
                className="flex-1 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
                disabled={rejecting}
              >
                <X size={14} />
                Reject
              </button>
              <button
                onClick={() => onApprove(application.id)}
                disabled={approving}
                className="flex-1 py-2.5 bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {approving && <Loader2 size={13} className="animate-spin" />}
                <CheckCircle2 size={14} />
                Approve
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ApplicationsManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  /* ─── Fetch Applications ─── */
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(API.GetAllApplications, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setToastMsg("Failed to fetch applications");
      setToastType("error");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Approve Application ─── */
  const handleApprove = async (appId) => {
    try {
      setApproving(true);
      const response = await fetch(API.ApproveApplication(appId), {
        method: "POST",
        headers: getHeaders(),
      });

      if (response.ok) {
        setToastMsg("Application approved successfully");
        setToastType("success");
        setSelectedApp(null);
        await fetchApplications();
      } else {
        const error = await response.json();
        setToastMsg(error.detail || "Failed to approve application");
        setToastType("error");
      }
    } catch (error) {
      console.error("Error approving application:", error);
      setToastMsg("Error approving application");
      setToastType("error");
    } finally {
      setApproving(false);
    }
  };

  /* ─── Reject Application ─── */
  const handleReject = async (appId, reason) => {
    try {
      setRejecting(true);
      const response = await fetch(API.RejectApplication(appId), {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ rejection_reason: reason }),
      });

      if (response.ok) {
        setToastMsg("Application rejected successfully");
        setToastType("success");
        setSelectedApp(null);
        await fetchApplications();
      } else {
        const error = await response.json();
        setToastMsg(error.detail || "Failed to reject application");
        setToastType("error");
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      setToastMsg("Error rejecting application");
      setToastType("error");
    } finally {
      setRejecting(false);
    }
  };

  /* ─── Initial Load ─── */
  React.useEffect(() => {
    fetchApplications();
  }, []);

  /* ─── Filter Applications ─── */
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchStatus = activeTab === "ALL" || app.status === activeTab;
      const matchSearch =
        searchQuery === "" ||
        app.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.leave_type?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        app.reason?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [applications, activeTab, searchQuery]);

  /* ─── Stats ─── */
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Leave Applications
            </h1>
            <p className="text-gray-600 mt-1">
              Review and manage employee leave applications
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "bg-yellow-50 text-yellow-700",
            },
            {
              label: "Approved",
              value: stats.approved,
              color: "bg-green-50 text-green-700",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              color: "bg-red-50 text-red-700",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.color} rounded-lg p-4 border border-opacity-30`}
            >
              <p className="text-xs font-semibold opacity-70">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by employee, leave type, or reason…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 transition text-sm"
              />
            </div>
          </div>
          <button
            onClick={fetchApplications}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex border-b border-gray-200">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
              {tab !== "ALL" && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {stats[tab.toLowerCase()]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No applications found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search"
                : "No applications in this category"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((app) => {
                  const statusCfg =
                    STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusCfg.icon;
                  const days = getDays(app.start_date, app.end_date);

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {app.employee?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {app.employee?.department?.name || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {app.leave_type?.name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(app.start_date)} to{" "}
                        {formatDate(app.end_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {days}d
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${statusCfg.dot.split(" ")[1]}`}
                          />
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.badge}`}
                          >
                            <StatusIcon size={11} />
                            {app.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1.5 transition"
                        >
                          <Eye size={14} />
                          Review
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

      {/* Modals */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          approving={approving}
          rejecting={rejecting}
        />
      )}

      {/* Toast */}
      <Toast msg={toastMsg} type={toastType} />
    </div>
  );
}

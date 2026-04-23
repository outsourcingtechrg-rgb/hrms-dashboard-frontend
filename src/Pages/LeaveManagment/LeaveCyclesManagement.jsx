import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  X,
  Calendar,
  AlertTriangle,
  Trash2,
  Loader2,
  Plus,
  Edit3,
  Eye,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  FileText,
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

/* ─── Create Leave Cycle Modal ─── */
function CycleModal({ cycle, onClose, onSave, loading }) {
  const [formData, setFormData] = useState(
    cycle || {
      name: "",
      start_date: "",
      end_date: "",
      is_active: true,
    },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.start_date) e.start_date = "Start date is required";
    if (!formData.end_date) e.end_date = "End date is required";
    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.start_date)
    ) {
      e.end_date = "End date must be after start date";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Calendar size={15} />
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              {cycle ? "Edit Leave Cycle" : "New Leave Cycle"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2 block">
              Cycle Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: "" });
              }}
              placeholder="e.g., 2024-2025 Cycle"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${
                errors.name ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2 block">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => {
                  setFormData({ ...formData, start_date: e.target.value });
                  setErrors({ ...errors, start_date: "" });
                }}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${
                  errors.start_date ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.start_date && (
                <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2 block">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => {
                  setFormData({ ...formData, end_date: e.target.value });
                  setErrors({ ...errors, end_date: "" });
                }}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${
                  errors.end_date ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.end_date && (
                <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Active Cycle</p>
              <p className="text-xs text-gray-500 mt-0.5">
                This is the current cycle
              </p>
            </div>
            <button
              onClick={() =>
                setFormData({ ...formData, is_active: !formData.is_active })
              }
              className={`relative inline-block w-11 h-6 rounded-full transition ${
                formData.is_active ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition transform ${
                  formData.is_active ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loading}
            className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {cycle ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function LeaveCyclesManagement() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [searchQuery, setSearchQuery] = useState("");

  /* ─── Fetch Cycles ─── */
  const fetchCycles = async () => {
    try {
      setLoading(true);
      const response = await fetch(API.LeaveCycles, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCycles(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching cycles:", error);
      setToastMsg("Failed to fetch leave cycles");
      setToastType("error");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Save Cycle (Create or Update) ─── */
  const handleSaveCycle = async (formData) => {
    try {
      const url = selectedCycle
        ? API.UpdateLeaveCycle(selectedCycle.id)
        : API.CreateLeaveCycle;
      const method = selectedCycle ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setToastMsg(
          selectedCycle
            ? "Cycle updated successfully"
            : "Cycle created successfully",
        );
        setToastType("success");
        setSelectedCycle(null);
        await fetchCycles();
      } else {
        const error = await response.json();
        setToastMsg(error.detail || "Failed to save cycle");
        setToastType("error");
      }
    } catch (error) {
      console.error("Error saving cycle:", error);
      setToastMsg("Error saving cycle");
      setToastType("error");
    }
  };

  /* ─── Delete Cycle ─── */
  const handleDeleteCycle = async (cycleId) => {
    if (!confirm("Are you sure you want to delete this leave cycle?")) return;

    try {
      setDeleting(cycleId);
      const response = await fetch(API.DeleteLeaveCycle(cycleId), {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (response.ok) {
        setToastMsg("Cycle deleted successfully");
        setToastType("success");
        await fetchCycles();
      } else {
        const error = await response.json();
        setToastMsg(error.detail || "Failed to delete cycle");
        setToastType("error");
      }
    } catch (error) {
      console.error("Error deleting cycle:", error);
      setToastMsg("Error deleting cycle");
      setToastType("error");
    } finally {
      setDeleting(null);
    }
  };

  /* ─── Initial Load ─── */
  React.useEffect(() => {
    fetchCycles();
  }, []);

  /* ─── Filter Cycles ─── */
  const filteredCycles = useMemo(() => {
    return cycles.filter(
      (cycle) =>
        searchQuery === "" ||
        cycle.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [cycles, searchQuery]);

  const activeCycle = cycles.find((c) => c.is_active);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leave Cycles</h1>
              <p className="text-gray-600 mt-1">
                Create and manage leave cycles
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCycle(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              <Plus size={16} />
              New Cycle
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      {activeCycle && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Active Leave Cycle
                </p>
                <p className="text-sm text-blue-700">
                  {activeCycle.name} • {formatDate(activeCycle.start_date)} to{" "}
                  {formatDate(activeCycle.end_date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search cycles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 transition text-sm"
              />
            </div>
          </div>
          <button
            onClick={fetchCycles}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cycles Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : filteredCycles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No leave cycles found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search"
                : "Create your first leave cycle"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    End Date
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
                {filteredCycles.map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {cycle.is_active && (
                          <div
                            className="w-2 h-2 rounded-full bg-green-500"
                            title="Active cycle"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {cycle.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(cycle.start_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(cycle.end_date)}
                    </td>
                    <td className="px-6 py-4">
                      {cycle.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 size={11} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                          <Clock size={11} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCycle(cycle);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1.5 transition"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCycle(cycle.id)}
                          disabled={deleting === cycle.id}
                          className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {deleting === cycle.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CycleModal
          cycle={selectedCycle}
          onClose={() => {
            setShowModal(false);
            setSelectedCycle(null);
          }}
          onSave={handleSaveCycle}
          loading={loading}
        />
      )}

      {/* Toast */}
      <Toast msg={toastMsg} type={toastType} />
    </div>
  );
}

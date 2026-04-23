# 🛠️ Component Patterns & Code Snippets

Quick reference for building components matching the established design system.

---

## Table of Contents

1. [Buttons](#buttons)
2. [Form Fields](#form-fields)
3. [Cards & Containers](#cards--containers)
4. [Badges & Status](#badges--status)
5. [Modals & Dialogs](#modals--dialogs)
6. [Tables & Lists](#tables--lists)
7. [Notifications](#notifications)
8. [Layout Patterns](#layout-patterns)
9. [Common Modules](#common-modules)

---

## Buttons

### Primary Button (CTA)

```jsx
<button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2">
  <CalendarDays size={13} />
  Submit Request
</button>
```

**Used in**: Form submissions, main actions

### Secondary Button (Cancel)

```jsx
<button className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition">
  Cancel
</button>
```

**Used in**: Cancel, close, secondary actions

### Danger Button (Delete)

```jsx
<button className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 transition">
  <X size={12} />
  Delete
</button>
```

**Used in**: Delete, reject, dangerous actions

### Icon Button

```jsx
<button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
  <X size={15} />
</button>
```

**Used in**: Close modal, quick actions

### Button with Loader

```jsx
<button disabled={saving} className="...">
  {saving ? (
    <>
      <Loader2 size={13} className="ml-spin" />
      Submitting…
    </>
  ) : (
    <>
      <CalendarDays size={13} />
      Submit
    </>
  )}
</button>
```

**Used in**: Async actions (submit, approve, delete)

### Button Group

```jsx
<div className="flex gap-3">
  <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
    Confirm
  </button>
  <button className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition">
    Cancel
  </button>
</div>
```

---

## Form Fields

### Text Input

```jsx
<div>
  <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
    Full Name *
  </label>
  <input
    type="text"
    placeholder="Enter your full name…"
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
  />
</div>
```

### Email Input

```jsx
<div>
  <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
    Email Address *
  </label>
  <input
    type="email"
    placeholder="your.email@company.com"
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
  />
</div>
```

### Date Input

```jsx
<div>
  <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
    Start Date *
  </label>
  <input
    type="date"
    min={today}
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
  />
</div>
```

### Select Dropdown

```jsx
<div>
  <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
    Leave Type *
  </label>
  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition">
    <option value="">Select leave type…</option>
    <option value="annual">Annual Leave</option>
    <option value="sick">Sick Leave</option>
    <option value="casual">Casual Leave</option>
  </select>
</div>
```

### Textarea

```jsx
<div>
  <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
    Reason for Request *
  </label>
  <textarea
    rows={3}
    placeholder="Please provide a reason for your request…"
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 resize-none transition leading-relaxed"
  />
  <div className="text-right text-xs text-gray-400 mt-1">
    {reason.length} chars
  </div>
</div>
```

### Input with Error

```jsx
<div>
  <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
    Department *
  </label>
  <input
    className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${
      errors.department ? "border-red-300" : "border-gray-200"
    }`}
  />
  {errors.department && (
    <p className="text-xs text-red-500 mt-1">{errors.department}</p>
  )}
</div>
```

### Two-Column Form

```jsx
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
      Start Date *
    </label>
    <input
      type="date"
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition"
    />
  </div>
  <div>
    <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
      End Date *
    </label>
    <input
      type="date"
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition"
    />
  </div>
</div>
```

---

## Cards & Containers

### Basic Card

```jsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
  <h3 className="font-bold text-gray-900 mb-3">Card Title</h3>
  <p className="text-sm text-gray-600">Card content goes here…</p>
</div>
```

### Card with Accent Border

```jsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-400 p-5">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="font-bold text-gray-900 mb-1">Pending Approval</h3>
      <p className="text-sm text-gray-500">Annual Leave · Jun 1-5, 2024</p>
    </div>
    <button className="text-xs text-gray-500 hover:text-red-600">Cancel</button>
  </div>
</div>
```

### Card with Stat

```jsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
  <div className="flex items-start justify-between mb-3">
    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
      Attendance Rate
    </span>
    <TrendingUp size={14} className="text-gray-300" />
  </div>
  <div className="flex items-end gap-2 mb-2">
    <span className="text-3xl font-bold text-emerald-600">98%</span>
    <span className="text-xs font-semibold text-emerald-600 mb-0.5">
      Excellent
    </span>
  </div>
  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
    <div className="h-2 rounded-full bg-emerald-500" style={{ width: "98%" }} />
  </div>
</div>
```

### Gradient Card (Balance)

```jsx
<div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
  <p className="text-sm opacity-90 mb-1">Annual Leave</p>
  <p className="text-4xl font-bold mb-4">15 days</p>
  <div className="flex gap-3 text-sm opacity-80">
    <span>5 used</span>
    <span>·</span>
    <span>2 pending</span>
  </div>
</div>
```

### Card Section with Header

```jsx
<div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
    <h3 className="font-bold text-gray-900 text-sm">Application Details</h3>
    <p className="text-xs text-gray-400 mt-0.5">Review and approve</p>
  </div>
  <div className="px-6 py-5 space-y-4">{/* Content */}</div>
</div>
```

---

## Badges & Status

### Status Badge (Pending)

```jsx
<span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
  <Clock size={11} />
  Pending
</span>
```

### Status Badge (Approved)

```jsx
<span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
  <CheckCircle2 size={11} />
  Approved
</span>
```

### Status Badge (Rejected)

```jsx
<span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-100 text-red-700 border-red-200">
  <Ban size={11} />
  Rejected
</span>
```

### Priority Badge (Urgent)

```jsx
<span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
  Urgent
</span>
```

### Category Tag

```jsx
<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200">
  HR
</span>
```

### Inline Success Badge

```jsx
<div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
  <BadgeCheck size={13} className="text-emerald-600" />
  <span className="text-xs font-bold text-emerald-700">Acknowledged</span>
</div>
```

### Dot + Label

```jsx
<span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1">
  <span className="w-2 h-2 rounded-full bg-amber-400" />
  Pending
</span>
```

---

## Modals & Dialogs

### Full Modal Template

```jsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm ml-fade">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden ml-up">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <CalendarDays size={16} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-sm">Modal Title</h2>
          <p className="text-xs text-gray-400">Subtitle or instruction</p>
        </div>
      </div>
      <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
        <X size={15} />
      </button>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
      {/* Content */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
      <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
        Confirm
      </button>
      <button className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition">
        Cancel
      </button>
    </div>
  </div>
</div>
```

### Confirmation Dialog

```jsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
    <div className="p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} className="text-red-600" />
      </div>
      <h2 className="font-bold text-gray-900 mb-2">Delete Item?</h2>
      <p className="text-sm text-gray-500 mb-6">
        This action cannot be undone. Are you sure?
      </p>
      <div className="flex gap-3">
        <button className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition">
          Delete
        </button>
        <button className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition">
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## Tables & Lists

### Table Header

```jsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
          Name
        </th>
        <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
          Status
        </th>
        <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
          Date
        </th>
        <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
          Action
        </th>
      </tr>
    </thead>
    <tbody>{/* Rows */}</tbody>
  </table>
</div>
```

### Table Row (Standard)

```jsx
<tr className="border-b border-gray-100 hover:bg-gray-50 transition">
  <td className="px-4 py-4">
    <span className="text-sm font-medium text-gray-900">John Doe</span>
  </td>
  <td className="px-4 py-4">
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
      <Clock size={11} />
      Pending
    </span>
  </td>
  <td className="px-4 py-4 text-sm text-gray-500">Jun 1, 2024</td>
  <td className="px-4 py-4 text-right">
    <button className="text-xs font-semibold text-blue-600 hover:underline">
      View
    </button>
  </td>
</tr>
```

### List Item Card

```jsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-3 hover:shadow-md transition">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-sm font-bold text-gray-900">Leave Request</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
          <Clock size={11} />
          Pending
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">Annual Leave · Jun 1-5, 2024</p>
      <span className="text-xs text-gray-400">Applied 2 days ago</span>
    </div>
    <button className="text-xs font-semibold text-gray-500 hover:text-red-600 whitespace-nowrap">
      Cancel
    </button>
  </div>
</div>
```

---

## Notifications

### Toast: Success

```jsx
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none ml-fade bg-emerald-600">
  <CheckCircle2 size={15} />
  Request submitted successfully
</div>
```

### Toast: Error

```jsx
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none ml-fade bg-red-600">
  <AlertCircle size={15} />
  Failed to submit request
</div>
```

### Info Banner

```jsx
<div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
  <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
  <p className="text-xs text-blue-700 leading-relaxed">
    Your request will be reviewed by HR. You'll be notified once a decision is
    made.
  </p>
</div>
```

### Warning Banner

```jsx
<div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
  <AlertTriangle size={13} className="text-amber-600 mt-0.5" />
  <p className="text-xs text-amber-700">Exceeds available balance by 3 days</p>
</div>
```

### Error Message (Inline)

```jsx
{
  errors.fieldName && (
    <p className="text-xs text-red-500 mt-1.5">{errors.fieldName}</p>
  );
}
```

---

## Layout Patterns

### Page Container

```jsx
<section className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </div>
</section>
```

### Page Header + Grid

```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Header */}
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
      <p className="text-sm text-gray-500 mt-1">Subtitle</p>
    </div>
    <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">
      Add New
    </button>
  </div>

  {/* Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Cards */}
  </div>
</div>
```

### Two Column Layout

```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main content - 2 columns */}
  <div className="lg:col-span-2">{/* Large area */}</div>

  {/* Sidebar - 1 column */}
  <div>{/* Summary or info */}</div>
</div>
```

### Stats Row (4 Columns)

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  {[
    { label: "Total", value: "45", change: "+2" },
    { label: "Pending", value: "12", change: "0" },
    { label: "Approved", value: "28", change: "+1" },
    { label: "Rejected", value: "5", change: "+1" },
  ].map((stat) => (
    <div
      key={stat.label}
      className="bg-white rounded-xl p-4 border border-gray-100"
    >
      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
        {stat.label}
      </span>
      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
      <span className="text-xs text-green-600 mt-1">{stat.change}</span>
    </div>
  ))}
</div>
```

### Tabs

```jsx
<div className="border-b border-gray-200">
  <div className="flex">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
          activeTab === tab.id
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-600 hover:text-gray-900"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
</div>
```

---

## Common Modules

### Header with Search & Filter

```jsx
<div className="flex items-center justify-between gap-4 mb-6">
  <div className="flex-1">
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-blue-400 transition"
      />
    </div>
  </div>
  <select
    value={filter}
    onChange={(e) => setFilter(e.target.value)}
    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-blue-400 transition"
  >
    <option value="">All</option>
    <option value="pending">Pending</option>
  </select>
</div>
```

### Loading State

```jsx
<div className="flex items-center gap-3 py-8">
  <Loader2 size={18} className="ml-spin text-blue-400" />
  <span className="text-sm text-gray-400">Loading data…</span>
</div>
```

### Empty State

```jsx
<div className="text-center py-12">
  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <Calendar size={24} className="text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
  <p className="text-sm text-gray-500">
    Try adjusting your filters or create a new item
  </p>
</div>
```

### Pagination

```jsx
<div className="flex items-center justify-between mt-6">
  <span className="text-xs text-gray-500">Showing 1-10 of {total}</span>
  <div className="flex gap-2">
    <button
      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
      disabled={page === 1}
    >
      ← Previous
    </button>
    <button
      className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
      disabled={page * pageSize >= total}
    >
      Next →
    </button>
  </div>
</div>
```

---

## Real-World Example: Leave Request Form

```jsx
import React, { useState } from "react";
import { CalendarDays, X, Loader2, Info, AlertTriangle } from "lucide-react";

export default function LeaveRequestModal({ onClose, leaveTypes, onSubmit }) {
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.leaveType) newErrors.leaveType = "Leave type is required";
    if (!form.startDate) newErrors.startDate = "Start date is required";
    if (!form.endDate) newErrors.endDate = "End date is required";
    if (new Date(form.endDate) < new Date(form.startDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    if (!form.reason || form.reason.trim().length < 10) {
      newErrors.reason = "Please provide a reason (min. 10 characters)";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm ml-fade">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden ml-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Request Leave</h2>
              <p className="text-xs text-gray-400">
                Submit a new leave request
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Leave Type */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              Leave Type *
            </label>
            <select
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${
                errors.leaveType ? "border-red-300" : "border-gray-200"
              }`}
            >
              <option value="">Select leave type…</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.leaveType && (
              <p className="text-xs text-red-500 mt-1">{errors.leaveType}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${
                  errors.startDate ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${
                  errors.endDate ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.endDate && (
                <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              Reason *
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Enter reason…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 resize-none transition ${
                errors.reason ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Your request will be reviewed by HR. You'll be notified once
              approved.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="ml-spin" />
                Submitting…
              </>
            ) : (
              <>
                <CalendarDays size={13} />
                Submit Request
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Usage Tips

1. **Always use `ml-fade` or `ml-up`** for initial animations on modals and cards
2. **Button states**: Always include hover and disabled states
3. **Form fields**: Always show error states inline with red borders
4. **Icons**: Use size 16 as default, adjust based on context
5. **Spacing**: Use `gap-3`, `gap-4` for internal spacing
6. **Colors**: Reference STATUS_CFG for consistency
7. **Accessibility**: Include aria-labels on icon buttons
8. **Loading**: Always disable button and show spinner text

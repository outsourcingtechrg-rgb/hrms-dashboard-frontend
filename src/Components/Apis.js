const mainOrigin = "http://127.0.0.1:8000/api/v1";
// const mainOrigin = "http://172.16.32.236:8000/api/v1";

export  const API = {
    // Authentication
  login: `${mainOrigin}/auth/login`, //linked
  changePassword: `${mainOrigin}/auth/change-password`, //linked
  resetpasword: `${mainOrigin}/auth/reset-password`, //
  forgetpasword: `${mainOrigin}/auth/forgot-password`, //linked

    // Employee Management
  GetAllEmployees: `${mainOrigin}/employees`,
  CreateEmployees: `${mainOrigin}/employees`,
  employeeDetails: (id) => `${mainOrigin}/employees/${id}`,
  UpdateEmployee: (id) => `${mainOrigin}/employees/${id}`,
  DeleteEmployee: (id) => `${mainOrigin}/employees/${id}`,
  employeeRoleByID: (id) => `${mainOrigin}/employees/${id}/role`,

  // Department Management
  ListDepartment: `${mainOrigin}/departments`,
  createDepartment: `${mainOrigin}/departments`,
  DepartmentDetails: (id) => `${mainOrigin}/departments/${id}`,
  deleteDepartment: (id) => `${mainOrigin}/departments/${id}`,
  updateDepartment: (id) => `${mainOrigin}/departments/${id}`,

  // Roles DONE
  AllRoles: `${mainOrigin}/roles`, //linked
  RoleByID: (id) => `${mainOrigin}/roles/${id}`, //linked
  CreateRoles: `${mainOrigin}/roles`, //linked
  DeleteRoleByID: (id) => `${mainOrigin}/roles/${id}`, //linked
  UpdateRoleByID: (id) => `${mainOrigin}/roles/${id}`, //linked

  // Shifts Done
  CreateShifts: `${mainOrigin}/shifts`, //linked
  ListShifts: `${mainOrigin}/shifts`, //linked
  shiftDetails: (id) => `${mainOrigin}/shifts/${id}`, //linked
  DeleteShift: (id) => `${mainOrigin}/shifts/${id}`, //linked
  UpdateShifts: (id) => `${mainOrigin}/shifts/${id}`, //linked
  shiftDetailsById: (id) => `${mainOrigin}/shifts/employee/${id}`, //linked

  // Attendance Sync
  ListAttendnaceSync: `${mainOrigin}/attendance/sync/`, //linked
  CreateAttendanceSync: `${mainOrigin}/attendance/sync/`, //linked
  GetAttendnaceSyncDetails: (deviceId) => `${mainOrigin}/attendance/sync/${deviceId}`, //linked
  DeleteAttendnaceSync: (deviceId) => `${mainOrigin}/attendance/sync/${deviceId}`, //linked
  UpdateAttendanceSync: (deviceId) => `${mainOrigin}/attendance/sync/${deviceId}`, //linked


  // admin Attendance records 

GetAttendanceAdmin: ({
  month,
  employee_id,
  department_id,
  status,
  skip = 0,
  limit = 200,
} = {}) => {
  const params = new URLSearchParams();

  if (month)         params.append("month", month);
  if (employee_id)   params.append("employee_id", employee_id);
  if (department_id) params.append("department_id", department_id);
  if (status)        params.append("status", status);

  params.append("skip", skip);
  params.append("limit", limit);

  return `${mainOrigin}/attendance/admin/records?${params.toString()}`;
},

GetAttendanceAdminSummary: (month, department_id) => {
  const params = new URLSearchParams();

  params.append("month", month);

  if (department_id) {
    params.append("department_id", department_id);
  }

  return `${mainOrigin}/attendance/admin/summary?${params.toString()}`;
},
// MY

// my attendance
  MyAttendance        : `${mainOrigin}/attendance/me`,
  MyAttendanceByMonth : (empId, month) => `${mainOrigin}/attendance/me?employee_id=${empId}&month=${month}`,
  MyAttendanceToday   : (empId) => `${mainOrigin}/attendance/me/today?employee_id=${empId}`,
  MyAttendanceSummary : (empId, month) => `${mainOrigin}/attendance/me/summary?employee_id=${empId}&month=${month}`,

  // Attendance
  AllAttendance: `${mainOrigin}/attendance`,
  AttendanceByEmployee: (empId, month) =>`${mainOrigin}/attendance/employee/${empId}/date/${month ? `?month=${month}` : ""}`,
  // AttendanceSummaryAdmin: `${mainOrigin}/attendance/summary`,

  // Notices
  notices: `${mainOrigin}/notices`,
  noticeDetails: (id) => `${mainOrigin}/notices/${id}`,

  AttendanceSummaryAdmin : (empId, month) => `${mainOrigin}/attendance/summary?employee_id=${empId}&month=${month}`,


  // ── Policy — Admin List ───────────────────────────────────────
  /** GET /policies/ */
  GetAllPolicies: (params = {}) => {
    const q = new URLSearchParams();

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "All") {
        q.append(k, v);
      }
    });

    const qs = q.toString();
    return `${mainOrigin}/policies/${qs ? `?${qs}` : ""}`; // ✅ trailing slash FIXED
  },

  /** GET /policies/stats */
  PolicyStats: `${mainOrigin}/policies/stats`,

  /** GET /policies/{id} */
  PolicyById: (id) => `${mainOrigin}/policies/${id}`,

  // ── Policy — CRUD ─────────────────────────────────────────────
  /** POST /policies/ */
  CreatePolicy: `${mainOrigin}/policies/`,

  /** PATCH /policies/{id} */
  UpdatePolicy: (id) => `${mainOrigin}/policies/${id}`,

  /** DELETE /policies/{id} */
  DeletePolicy: (id) => `${mainOrigin}/policies/${id}`,

  // ── Policy — Admin Actions ────────────────────────────────────
  /** POST /policies/{id}/pin */
  PinPolicy: (id) => `${mainOrigin}/policies/${id}/pin`,

  /** POST /policies/{id}/toggle-status */
  TogglePolicyStatus: (id) =>
    `${mainOrigin}/policies/${id}/toggle-status`,

  // ── Policy — Workflow ─────────────────────────────────────────
  /** POST /policies/{id}/submit-review */
  SubmitPolicyReview: (id) =>
    `${mainOrigin}/policies/${id}/submit-review`,

  /** POST /policies/{id}/approve */
  ApprovePolicy: (id) =>
    `${mainOrigin}/policies/${id}/approve`,

  /** POST /policies/{id}/reject */
  RejectPolicy: (id) =>
    `${mainOrigin}/policies/${id}/reject`,

  /** POST /policies/{id}/publish */
  PublishPolicy: (id) =>
    `${mainOrigin}/policies/${id}/publish`,

  // ── Policy — Employee ─────────────────────────────────────────
  /** GET /policies/my */
  MyPolicies: (params = {}) => {
    const q = new URLSearchParams();

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "All") {
        q.append(k, v);
      }
    });

    const qs = q.toString();
    return `${mainOrigin}/policies/my${qs ? `?${qs}` : ""}`;
  },

  /** GET /policies/my/acked */
  MyAckedPolicies: `${mainOrigin}/policies/my/acked`,

  /** POST /policies/{id}/acknowledge */
  AcknowledgePolicy: (id) =>
    `${mainOrigin}/policies/${id}/acknowledge`,

  GetAllNotices: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "All" && v !== null) q.append(k, v); });
    const qs = q.toString();
    return `${mainOrigin}/notices/${qs ? "?" + qs : ""}`;
  },
 
  /** GET /notices/stats */
  NoticeStats: `${mainOrigin}/notices/stats`,
 
  /** GET /notices/{id} */
  NoticeById: (id) => `${mainOrigin}/notices/${id}`,
 
  /** POST /notices/ */
  CreateNotice: `${mainOrigin}/notices/`,
 
  /** PATCH /notices/{id} */
  UpdateNotice: (id) => `${mainOrigin}/notices/${id}`,
 
  /** DELETE /notices/{id} */
  DeleteNotice: (id) => `${mainOrigin}/notices/${id}`,
 
  /** POST /notices/{id}/pin  — toggles pinned */
  PinNotice: (id) => `${mainOrigin}/notices/${id}/pin`,
 
  /** POST /notices/{id}/toggle  — toggles is_active */
  ToggleNotice: (id) => `${mainOrigin}/notices/${id}/toggle`,
 
  // ── Employee endpoints ─────────────────────────────────────────
 
  /** GET /notices/my  — audience-scoped, with acknowledged=true/false */
  MyNotices: `${mainOrigin}/notices/my`,
 
  /** GET /notices/my/acked  — list of notice IDs the employee has acked */
  MyAckedNotices: `${mainOrigin}/notices/my/acked`,
 
  /** POST /notices/{id}/acknowledge */
  AcknowledgeNotice: (id) => `${mainOrigin}/notices/${id}/acknowledge`,


  //  Leaves

  // =====================================================
  // APPLICATIONS (EMPLOYEE + HR)
  // =====================================================

  GetAllApplications: (params = "") =>
    `${mainOrigin}/leaves/applications${params}`,

  ApplyLeave: () =>
    `${mainOrigin}/leaves/applications`,

  GetMyApplications: () =>
    `${mainOrigin}/leaves/applications/me`,

  GetApplication: (id) =>
    `${mainOrigin}/leaves/applications/${id}`,

  CancelApplication: (id) =>
    `${mainOrigin}/leaves/applications/${id}/cancel`,

  // HR
  GetPendingApplications: (params = "") =>
    `${mainOrigin}/leaves/applications/pending${params}`,

  GetApplicationsByEmployee: (employee_id, params = "") =>
    `${mainOrigin}/leaves/applications/employee/${employee_id}${params}`,

  ApproveApplication: (id) =>
    `${mainOrigin}/leaves/applications/${id}/approve`,

  RejectApplication: (id) =>
    `${mainOrigin}/leaves/applications/${id}/reject`,

  // =====================================================
  // ATTACHMENTS
  // =====================================================

  UploadAttachment: (id) =>
    `${mainOrigin}/leaves/applications/${id}/attachments`,

  GetApplicationAttachments: (id) =>
    `${mainOrigin}/leaves/applications/${id}/attachments`,

  DownloadAttachment: (attachment_id) =>
    `${mainOrigin}/leaves/attachments/${attachment_id}/download`,

  // HR access (management)
  GetManagementAttachments: (id) =>
    `${mainOrigin}/leaves/management/applications/${id}/attachments`,

  DownloadManagementAttachment: (attachment_id) =>
    `${mainOrigin}/leaves/management/attachments/${attachment_id}/download`,

  // =====================================================
  // SUMMARY
  // =====================================================

  GetMySummary: () =>
    `${mainOrigin}/leaves/summary/me`,

  GetEmployeeSummary: (employee_id) =>
    `${mainOrigin}/leaves/summary/employee/${employee_id}`,

  // =====================================================
  // LEAVE TYPES
  // =====================================================

  GetAllTypes: () =>
    `${mainOrigin}/leaves/types`,
  GetAllTypesEmployees: () =>
    `${mainOrigin}/leaves/types/employees`,

  CreateType: () =>
    `${mainOrigin}/leaves/types`,

  GetTypesByCycle: (cycle_id) =>
    `${mainOrigin}/leaves/types/cycle/${cycle_id}`,

  UpdateType: (type_id) =>
    `${mainOrigin}/leaves/types/${type_id}`,

  DeleteType: (type_id) =>
    `${mainOrigin}/leaves/types/${type_id}`,

  // =====================================================
  // CYCLES
  // =====================================================

  GetAllCycles: () =>
    `${mainOrigin}/leaves/cycles`,

  CreateCycle: () =>
    `${mainOrigin}/leaves/cycles`,

  GetActiveCycle: () =>
    `${mainOrigin}/leaves/cycles/active`,

  UpdateCycle: (cycle_id) =>
    `${mainOrigin}/leaves/cycles/${cycle_id}`,

  DeleteCycle: (cycle_id) =>
    `${mainOrigin}/leaves/cycles/${cycle_id}`,

  // =====================================================
  // DASHBOARD (HR)
  // =====================================================

  GetDashboardStats: () =>
    `${mainOrigin}/leaves/dashboard/stats`,




  // Tickets

  list:          ()    => `${mainOrigin}/tickets/my`,
  create:        ()    => `${mainOrigin}/tickets`,
  detail:        (id)  => `${mainOrigin}/tickets/${id}`,
  cancel:        (id)  => `${mainOrigin}/tickets/${id}/cancel`,
  comment:       (id)  => `${mainOrigin}/tickets/${id}/comments`,
  attachments:   (id)  => `${mainOrigin}/tickets/${id}/attachments`,
  uploadAtt:     (id)  => `${mainOrigin}/tickets/${id}/attachments`,
  downloadAtt:   (id)  => `${mainOrigin}/tickets/attachments/${id}/download`,
  categories:    ()    => `${mainOrigin}/tickets/categories`,

  all:              (p = "") => `${mainOrigin}/tickets${p}`,
  detail:           (id)    => `${mainOrigin}/tickets/${id}`,
  assign:           (id)    => `${mainOrigin}/tickets/${id}/assign`,
  resolve:          (id)    => `${mainOrigin}/tickets/${id}/resolve`,
  close:            (id)    => `${mainOrigin}/tickets/${id}/close`,
  comment:          (id)    => `${mainOrigin}/tickets/${id}/comments`,
  attachments:      (id)    => `${mainOrigin}/tickets/${id}/attachments`,
  mgmtAtts:         (id)    => `${mainOrigin}/tickets/management/${id}/attachments`,
  downloadAtt:      (aid)   => `${mainOrigin}/tickets/management/attachments/${aid}/download`,
  categories:       ()      => `${mainOrigin}/tickets/categories`,
  createCategory:   ()      => `${mainOrigin}/tickets/categories`,
  updateCategory:   (id)    => `${mainOrigin}/tickets/categories/${id}`,
  deleteCategory:   (id)    => `${mainOrigin}/tickets/categories/${id}`,
  stats:            ()      => `${mainOrigin}/tickets/dashboard/stats`,
  employees:        ()      => `${mainOrigin}/employees`,

  // tickets
  // my tickets
  list:          ()    => `${mainOrigin}/tickets/my`,
  create:        ()    => `${mainOrigin}/tickets`,
  detail:        (id)  => `${mainOrigin}/tickets/${id}`,
  cancel:        (id)  => `${mainOrigin}/tickets/${id}/cancel`,
  comment:       (id)  => `${mainOrigin}/tickets/${id}/comments`,
  attachments:   (id)  => `${mainOrigin}/tickets/${id}/attachments`,
  uploadAtt:     (id)  => `${mainOrigin}/tickets/${id}/attachments`,
  downloadAtt:   (id)  => `${mainOrigin}/tickets/attachments/${id}/download`,
  categories:    ()    => `${mainOrigin}/tickets/categories`,
  // ticket management
   me: () => {
  const tokenData = getTokenData();
  const EPI = tokenData?.EPI;

  if (!EPI) throw new Error("Invalid token: EPI missing");

  return `${mainOrigin}/employees/${EPI}/role`;
},
  all:             ()    => `${mainOrigin}/tickets`,
  detail:          (id)  => `${mainOrigin}/tickets/${id}`,
  assign:          (id)  => `${mainOrigin}/tickets/${id}/assign`,
  resolve:         (id)  => `${mainOrigin}/tickets/${id}/resolve`,
  close:           (id)  => `${mainOrigin}/tickets/${id}/close`,
  comment:         (id)  => `${mainOrigin}/tickets/${id}/comments`,
  mgmtAtts:        (id)  => `${mainOrigin}/tickets/management/${id}/attachments`,
  downloadAtt:     (aid) => `${mainOrigin}/tickets/management/attachments/${aid}/download`,
  categories:      ()    => `${mainOrigin}/tickets/categories`,
  createCategory:  ()    => `${mainOrigin}/tickets/categories`,
  updateCategory:  (id)  => `${mainOrigin}/tickets/categories/${id}`,
  deleteCategory:  (id)  => `${mainOrigin}/tickets/categories/${id}`,
  stats:           ()    => `${mainOrigin}/tickets/dashboard/stats`,
  employees:       ()    => `${mainOrigin}/employees`,
  departments:     ()    => `${mainOrigin}/departments`,

  // my work tickets
    me:          ()    => {
    const tokenData = getTokenData();
    const EPI = tokenData?.EPI;
    return EPI ? `${mainOrigin}/employees/${EPI}/role` : `${mainOrigin}/auth/me`;
  },
  all:         ()    => `${mainOrigin}/tickets`,
  detail:      (id)  => `${mainOrigin}/tickets/${id}`,
  resolve:     (id)  => `${mainOrigin}/tickets/${id}/resolve`,
  comment:     (id)  => `${mainOrigin}/tickets/${id}/comments`,
  mgmtAtts:    (id)  => `${mainOrigin}/tickets/management/${id}/attachments`,
  downloadAtt: (aid) => `${mainOrigin}/tickets/management/attachments/${aid}/download`,

// shift Assigner

  // GET    /api/shift-assignments         → list all EmployeeShiftAssignment rows
  ListAssignments: `${mainOrigin}/shift-assignments`,
  // POST   /api/shift-assignments         → create new assignment
  CreateAssignment: `${mainOrigin}/shift-assignments`,
  // PATCH  /api/shift-assignments/:id     → update (e.g. set effective_to)
  UpdateAssignment: (id) => `${mainOrigin}/shift-assignments/${id}`,
  // DELETE /api/shift-assignments/:id     → delete assignment
  DeleteAssignment: (id) => `${mainOrigin}/shift-assignments/${id}`,
  // POST   /api/shift-assignments/:id/end → set effective_to to now (early termination)
  EndAssignment: (id) => `${mainOrigin}/shift-assignments/${id}/end`,

};
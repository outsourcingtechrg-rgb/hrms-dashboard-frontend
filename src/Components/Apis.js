const mainOrigin = "http://127.0.0.1:8000/api/v1";

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
  shiftDetailsById: (id) => `${mainOrigin}/shifts/employee/${id}`,
  
  // Attendance Sync
  ListAttendnaceSync: `${mainOrigin}/attendance/sync/`, //linked
  CreateAttendanceSync: `${mainOrigin}/attendance/sync/`, //linked
  GetAttendnaceSyncDetails: (deviceId) => `${mainOrigin}/attendance/sync/${deviceId}`, //linked
  DeleteAttendnaceSync: (deviceId) => `${mainOrigin}/attendance/sync/${deviceId}`, //linked
  UpdateAttendanceSync: (deviceId) => `${mainOrigin}/attendance/sync/${deviceId}`, //linked

// MY
// my attendance
  // // myAttendance: `${mainOrigin}/attendance/me`,
  // myAttendance: `${mainOrigin}/attendance/me/today`,
  // myAttendance: `${mainOrigin}/attendance/me/summary`,
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

};
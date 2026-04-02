/**
 * authUtils.js — Authentication & Authorization Helpers
 * 
 * Centralized utilities for JWT parsing, role checking, and department-based filtering
 */

/**
 * Decode JWT payload and extract user info
 * @param {string} token - JWT token
 * @returns {object|null} { level, department_id, employee_id, ... } or null if invalid
 */
export function decodeJWT(token) {
  try {
    if (!token) return null;
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return {
      level: Number(payload.level ?? payload.role_level ?? 99),
      department_id: payload.department_id ?? null,
      employee_id: payload.employee_id ?? payload.sub ?? payload.id ?? null,
      email: payload.email ?? null,
      ...payload, // Include all other fields
    };
  } catch (err) {
    console.warn("[JWT decode failed]", err.message);
    return null;
  }
}

/**
 * Get current user auth from localStorage
 * @returns {object|null} Decoded JWT data or null
 */
export function getAuthFromStorage() {
  try {
    const token = localStorage.getItem("access_token");
    return decodeJWT(token);
  } catch {
    return null;
  }
}

/**
 * Check if user is a department head
 * @param {number} userLevel - User's role level
 * @returns {boolean}
 */
export function isDepartmentHead(userLevel) {
  return userLevel === 6;
}

/**
 * Filter employees to show only those in the user's department
 * @param {array} employees - Array of employee objects
 * @param {object} auth - Auth object with level and department_id
 * @returns {array} Filtered employees
 */
export function filterEmployeesByDepartment(employees, auth) {
  if (!auth || !isDepartmentHead(auth.level) || auth.department_id == null) {
    return employees;
  }
  return employees.filter(e => 
    Number(e.department_id) === Number(auth.department_id) && !e.is_deleted
  );
}

/**
 * Filter departments to show only the user's department
 * @param {array} departments - Array of department objects
 * @param {object} auth - Auth object with level and department_id
 * @returns {array} Filtered departments
 */
export function filterDepartmentsList(departments, auth) {
  if (!auth || !isDepartmentHead(auth.level) || auth.department_id == null) {
    return departments;
  }
  return departments.filter(d => Number(d.id) === Number(auth.department_id));
}

/**
 * Get auth headers with Bearer token
 * @param {string} token - Optional token (uses localStorage if not provided)
 * @returns {object} Headers object for fetch
 */
export function getAuthHeaders(token = null) {
  const tk = token || localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
  };
}

/**
 * Build department query parameter for API calls
 * @param {object} auth - Auth object
 * @returns {string} Query string like "&department_id=5" or ""
 */
export function getDepartmentQueryParam(auth) {
  if (!auth || !isDepartmentHead(auth.level) || auth.department_id == null) {
    return "";
  }
  return `&department_id=${auth.department_id}`;
}

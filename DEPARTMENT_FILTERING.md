# Department-Based Employee Filtering Guide

## Overview

Department heads can now only see employees from their assigned department. This filtering is applied automatically across the application based on the user's role and department ID extracted from their JWT token.

## Implementation Details

### Role Identification

- **Department Head Role ID**: `6`
- Detection is automatic via JWT token analysis
- The `level` field from JWT is checked: `level === 6`

### How It Works

#### 1. **Authentication Utility** (`src/utils/authUtils.js`)

Central utilities for handling department-based employee filtering:

```javascript
// Get current user from JWT
const auth = getAuthFromStorage();

// Check if user is department head
if (isDepartmentHead(auth.level)) { ... }

// Filter employees to show only department's employees
const filtered = filterEmployeesByDepartment(employees, auth);

// Get API query parameter for backend filtering
const params = getDepartmentQueryParam(auth); // "&department_id=5"
```

#### 2. **Employees Page** (`src/Pages/employee_mangmant/Employees.jsx`)

```javascript
// Automatically scopes employee list
const scopedEmployees = useMemo(
  () => filterEmployeesByDepartment(employees, auth),
  [employees, auth],
);

// Automatically scopes department dropdown
const scopedDepartments = useMemo(
  () => filterDepartmentsList(depts, auth),
  [depts, auth],
);
```

#### 3. **Department Head Dashboard** (`src/Pages/Dashboard/DepartmentHeadDashboard.jsx`)

```javascript
// Applies same filtering when fetching employees
setEmployees(filterEmployeesByDepartment(all, auth));
```

## Features

### What Department Heads See:

✅ **On Employees Page**:

- Only employees from their department
- Only their department in the department dropdown
- Filtered statistics (total, active, inactive, etc.)
- Department breakdown shows only their team

✅ **On Department Head Dashboard**:

- Team members from their department only
- Filtered attendance records
- Filtered applications from their team

✅ **File Operations**:

- Can only create/edit/delete employees in their department
- Cannot reassign employees to other departments

### What Other Roles See:

- Super Admin (1): All employees, all departments
- CEO (2): All employees, all departments
- HR Admin (3): All employees, all departments
- HR (4): All employees, all departments
- Finance Head (5): No employee restrictions
- Department Head (6): **Only their department** ⭐
- Team Lead (7): No employee restrictions (depends on backend)
- Employee (8): No employee restrictions
- Intern (9): No employee restrictions

## JWT Token Structure

Your JWT needs to contain:

```json
{
  "level": 6, // Role level (6 = Department Head)
  "department_id": 5, // Department ID
  "employee_id": 123, // Optional: Employee ID
  "email": "head@company.com" // Optional: Email
  // ... other fields
}
```

## API Requests

When a department head fetches data, the frontend automatically filters:

```javascript
// Frontend fetches all, then filters client-side:
GET / api / v1 / employees;

// Then filters to:
employees.filter((e) => e.department_id === auth.department_id);
```

For attendance records, the backend also supports department filtering:

```javascript
GET /api/v1/attendance/admin/summary?department_id=5
GET /api/v1/attendance/admin/records?department_id=5
```

## File Structure

```
src/
├── utils/
│   └── authUtils.js           ← Centralized filtering logic
├── Pages/
│   ├── employee_mangmant/
│   │   └── Employees.jsx      ← Uses filterEmployeesByDepartment()
│   └── Dashboard/
│       └── DepartmentHeadDashboard.jsx ← Uses filterEmployeesByDepartment()
└── Components/
    └── Apis.js                ← API endpoints
```

## Usage Examples

### Example 1: Get Filtered Employees in a Component

```javascript
import {
  filterEmployeesByDepartment,
  getAuthFromStorage,
} from "../utils/authUtils";

// In your component:
const auth = getAuthFromStorage();
const scopedEmployees = useMemo(
  () => filterEmployeesByDepartment(employees, auth),
  [employees, auth],
);
```

### Example 2: Check if User is Department Head

```javascript
import { isDepartmentHead } from "../utils/authUtils";

const auth = getAuthFromStorage();
if (isDepartmentHead(auth.level)) {
  // Show department head specific UI
}
```

### Example 3: Get Filtered Departments

```javascript
import { filterDepartmentsList } from "../utils/authUtils";

const scopedDepts = filterDepartmentsList(departments, auth);
```

## Testing

### To test department head filtering:

1. **Login as Department Head** (role level 6)
2. **Check JWT token**: Open DevTools → Application → localStorage → look for `access_token`
3. **Verify filtering**:
   - Go to Employees page → Should see only employees from your department
   - Check Department Head Dashboard → Should see only your team
   - Try to create an employee → Should only be able to assign to your department

### Debug: Check Current User

```javascript
// In browser console:
localStorage.getItem("access_token"); // Copy and paste at jwt.io to decode
```

## Modifications & Extensions

### To add filtering to another component:

1. Import the utility:

```javascript
import {
  filterEmployeesByDepartment,
  getAuthFromStorage,
} from "../../utils/authUtils";
```

2. Get auth and apply filtering:

```javascript
const auth = getAuthFromStorage();
const scopedEmployees = filterEmployeesByDepartment(employees, auth);
```

### To modify filtering logic:

Edit `src/utils/authUtils.js` functions:

- `filterEmployeesByDepartment()` - Employee filtering
- `filterDepartmentsList()` - Department list filtering
- `isDepartmentHead()` - Department head detection

## Status

✅ **Implemented**:

- Employee list filtering (Employees.jsx)
- Department list filtering (Employees.jsx)
- Dashboard filtering (DepartmentHeadDashboard.jsx)
- Statistics calculation for filtered employees
- Attendance record filtering

❓ **Verify with Backend**:

- Confirm all necessary fields present in JWT token
- Confirm employee `department_id` field exists and is populated
- Test with actual department head user account

## Troubleshooting

### Department head sees all employees?

- Check JWT token contains `level: 6` and valid `department_id`
- Verify employees have correct `department_id` value set

### Dropdown shows all departments?

- Check `filterDepartmentsList()` is being used
- Ensure auth object properly extracted from JWT

### Inconsistent filtering?

- Verify all employee pages use centralized utility functions
- Check for hardcoded employee lists that bypass filtering

## Performance Notes

- Filtering is done client-side (in memory) after API fetch
- For large datasets (1000+ employees), consider backend filtering
- Can be optimized by adding server-side filtering: `/api/v1/employees?department_id=5`

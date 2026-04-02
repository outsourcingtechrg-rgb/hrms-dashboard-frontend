# Quick Reference - Department Filtering

## 🎯 TL;DR - How It Works

Department heads (role 6) automatically see **only employees from their department**.

## 📦 What's Included

### Utility Functions (`src/utils/authUtils.js`)

```javascript
getAuthFromStorage(); // Get user info from JWT
isDepartmentHead(level); // Is user a department head?
filterEmployeesByDepartment(); // Filter employees list
filterDepartmentsList(); // Filter departments list
getAuthHeaders(); // Get auth headers
getDepartmentQueryParam(); // Get department query param
```

### Components Updated

- ✅ `Employees.jsx` - Employee management page
- ✅ `DepartmentHeadDashboard.jsx` - Department head dashboard
- ✅ `MyPolicies.jsx` - Fixed API call bug

## 🚀 Implementation Checklist

For **department heads**:

- [x] See only employees from their department
- [x] See only their department in dropdown
- [x] Statistics show only their team
- [x] Can only manage their department

For **other roles**:

- [x] See all employees (unchanged)
- [x] See all departments (unchanged)
- [x] No restrictions applied

## 🔍 Quick Debug

**Check if filtering works:**

```javascript
// Browser console
const auth = JSON.parse(
  atob(localStorage.getItem("access_token").split(".")[1]),
);
console.log("Role:", auth.level); // Should be 6
console.log("Department:", auth.department_id); // Should have value
```

**Check employee data:**

```javascript
// In Employees.jsx, add this console log:
console.log("Employees:", employees);
// Each should have: { id, f_name, department_id, ... }
```

## 📁 File Locations

| File                                              | Purpose              | Status     |
| ------------------------------------------------- | -------------------- | ---------- |
| `src/utils/authUtils.js`                          | Filtering logic      | ✅ NEW     |
| `src/Pages/employee_mangmant/Employees.jsx`       | Employee management  | ✅ UPDATED |
| `src/Pages/Dashboard/DepartmentHeadDashboard.jsx` | Department dashboard | ✅ UPDATED |
| `DEPARTMENT_FILTERING.md`                         | Full documentation   | ✅ NEW     |
| `IMPLEMENTATION_SUMMARY.md`                       | Implementation guide | ✅ NEW     |

## 💡 Usage Pattern

```javascript
import {
  getAuthFromStorage,
  filterEmployeesByDepartment,
} from "../utils/authUtils";

// Get current user
const auth = getAuthFromStorage();

// Filter employees (works for all roles)
const scoped = filterEmployeesByDepartment(employees, auth);
// Department head: scoped = filtered list
// Other roles: scoped = full list (no filtering)
```

## 🎓 Examples

### Example 1: Show filtered employees

```javascript
const scopedEmp = filterEmployeesByDepartment(allEmp, auth);
{
  scopedEmp.map((e) => <div key={e.id}>{e.f_name}</div>);
}
```

### Example 2: Check role

```javascript
const isDeptHead = isDepartmentHead(auth?.level);
if (isDeptHead) {
  // Show department head UI
}
```

### Example 3: Add to new component

```javascript
const auth = getAuthFromStorage();
const scopedDepts = filterDepartmentsList(depts, auth);
```

## ⚠️ Important

1. **Filtering is CLIENT-SIDE**: Complements backend security
2. **JWT must contain** `level` and `department_id`
3. **Employees must have** `department_id` field
4. **Works automatically** - No additional config needed

## ✅ Testing

```bash
# 1. Login as Department Head
→ Navigate to Employees
→ Should see only their team

# 2. Check JWT
→ localStorage shows correct department_id

# 3. Verify counts
→ Total employees = count from dashboard

# 4. Try other roles
→ Should see all employees
```

## 🔧 If It Doesn't Work

| Problem                  | Solution                                        |
| ------------------------ | ----------------------------------------------- |
| Sees all employees       | Check JWT `level=6` and `department_id` valid   |
| Dropdown shows all depts | Verify `filterDepartmentsList()` is called      |
| Stats are wrong          | Check `scopedEmployees` is used in calculations |
| No employees show        | Verify employees have `department_id` field     |

## 📚 Full Docs

See `DEPARTMENT_FILTERING.md` for:

- Complete implementation details
- API integration
- Performance notes
- Troubleshooting guide
- Extension examples

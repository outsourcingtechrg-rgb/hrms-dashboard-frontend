import { useParams, useNavigate } from "react-router-dom";

export default function EmployeeAttendanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-blue-600"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-semibold mb-2">
        Employee #{id}
      </h1>
      <p className="text-gray-500 mb-6">
        Full Attendance History
      </p>

      {/* You can add calendar + table here */}
      <div className="bg-white p-6 rounded shadow-sm">
        Attendance details, logs, charts, late count, etc.
      </div>
    </div>
  );
}
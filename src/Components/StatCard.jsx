import React from "react";

const MetricCard = ({ label, value, change, Icon }) => {
  const isPositive = change >= 0;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
      
      {/* Left section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Text */}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {value}
          </h2>
        </div>
      </div>

      {/* Right section (Change) */}
      <div
        className={`flex items-center gap-1 text-sm font-semibold ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        <span>{isPositive ? "▲" : "▼"}</span>
        <span>{Math.abs(change)}%</span>
      </div>
    </div>
  );
};

const StatCard = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          label={metric.label}
          value={metric.value}
          change={metric.change}
          Icon={metric.icon}
        />
      ))}
    </div>
  );
};

export default StatCard;
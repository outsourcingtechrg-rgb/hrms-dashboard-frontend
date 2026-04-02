// import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import React from "react";
export default function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
      
      <div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center"
      >
        {/* Badge */}
        <span className="inline-block bg-red-700 text-white text-xs px-4 py-1 rounded-full mb-4">
          HRMS Module
        </span>

        {/* Title */}
        <h1 className="text-3xl font-bold text-red-700 mb-2">
          Coming Soon 🚧
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          This module is currently under development.  
          We're working hard to launch it soon!
        </p>

        {/* Animated Loader */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-red-700 rounded-full animate-spin"></div>
        </div>

        {/* Icon Row */}
        <div className="flex items-center justify-center gap-2 text-red-700 mb-6">
          <Clock size={18} />
          <span className="text-sm font-medium">Launching Soon</span>
        </div>

        {/* Button */}
        <button
          onClick={() => window.history.back()}
          className="bg-red-700 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
        >
          Back to Dashboard
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          © 2026 HRMS System
        </p>
      </div>
    </div>
  );
}
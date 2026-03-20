import React, { useState } from "react";
import { X, Mail, CheckCircle } from "lucide-react";
import {API} from "../../Components/Apis";
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    const response = await fetch(API.forgetpasword, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // ✅ ONLY EMAIL
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Request failed");
    }

    // ✅ success state
    setIsSubmitted(true);

   
    // Auto close after 3 sec
    setTimeout(() => {
      handleClose();
    }, 3000);

  } catch (err: any) {
    console.error("Error:", err);
    } finally {
    setIsLoading(false);
  }
};
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail("");
      setIsSubmitted(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={handleClose}
        aria-label="Close modal"
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="w-14 h-14 bg-[#990400]/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-[#990400]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="reset-email" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#990400]/30 focus:border-[#990400] transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#990400] hover:bg-[#7a0300] text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors text-sm"
              >
                Back to Login
              </button>
            </form>
          </>
        ) : (
          // Success State
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 text-sm md:text-base mb-4">
              We've sent a password reset link to
            </p>
            <p className="text-[#990400] font-medium text-sm md:text-base mb-6">
              {email}
            </p>
            <p className="text-gray-500 text-sm">
              Redirecting you back to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

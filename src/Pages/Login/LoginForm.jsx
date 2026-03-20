import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import imgCharacterWorkingLaptopWhileSittingChair from "../../assets/332b003c75249e55dce189cba573b1ad5398e39f.png";
import imgR21 from "../../assets/rig.png";
import CactusPlant from "./CactusPlant";
import HRMS from "../../assets/81345320173.png";
import { API } from "../../Components/Apis";

export default function LoginForm({ onForgotPassword, onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(API.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // ❌ backend error
      if (!response.ok) {
        throw new Error(data?.detail || "Login failed");
      }

      // ❌ NO TOKEN = HARD FAIL
      if (!data?.access_token) {
        throw new Error("Access token not received");
      }

      // ✅ SAVE TOKEN ONCE (IMPORTANT)
      localStorage.setItem("access_token", data.access_token);

      // ✅ Mark authenticated and refresh UI
      if (onLogin) {
        await onLogin();
      }

      // ✅ Navigate AFTER token is saved and UI is refreshed
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (data.force_change === true) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[rgba(255,255,255,0.95)] to-[rgba(176,41,0,0.37)] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Character illustration - hidden on mobile */}
        <div className="hidden lg:block absolute left-0 bottom-0 w-115 h-120 opacity-80">
          <img
            src={imgCharacterWorkingLaptopWhileSittingChair}
            alt=""
            className="w-full h-full object-contain transform scale-y-[-1] rotate-180"
          />
        </div>

        {/* Cactus plant - adjusted for different screen sizes */}
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-12 lg:bottom-12 lg:right-24">
          <CactusPlant />
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-110 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 lg:p-10">
        {/* Logo */}
        <div className="mb-8 md:mb-10">
          <div className="h-15 md:h-17.25 w-full flex items-center justify-center overflow-hidden">
            <img
              src={imgR21}
              alt="RIG DIGITAL Logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="h-5 w-full flex items-center justify-center overflow-hidden">
            <img
              src={HRMS}
              alt="HRMS Logo"
              className="h-4 w-auto object-contain"
            />
          </div>
        </div>
        <div className="flex items-center justify-center overflow-hidden text-center text-red-500">
          <span>{error}</span>
        </div>
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-black text-base font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#c0dbea] rounded border-0 text-sm text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#990400]/30 transition-all shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
              placeholder="login@rigdigital.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-black text-base font-medium"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#c0dbea] rounded border-0 text-sm text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#990400]/30 transition-all shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] pr-12"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#c0dbea] hover:bg-[#a8c8d8] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#990400]/30"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-[#D885A3]" />
                ) : (
                  <Eye className="w-4 h-4 text-[#D885A3]" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer w-full bg-[#990400] hover:bg-[#7a0300] text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {isLoading ? (
              <span>LOGGING IN...</span>
            ) : (
              <>
                <span>LOGIN</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={onForgotPassword}
              className="cursor-pointer text-sm text-[#990400] hover:text-[#7a0300] font-medium transition-colors underline"
            >
              Forgot Password?
            </button>
            {/* <a href="/reset-password" className="cursor-pointer text-sm text-[#990400] hover:text-[#7a0300] font-medium transition-colors underline">
              Forgot Password?
            </a> */}
          </div>
        </form>
      </div>
    </div>
  );
}

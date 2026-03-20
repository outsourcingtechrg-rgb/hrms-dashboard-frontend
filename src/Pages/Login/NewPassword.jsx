import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import imgCharacterWorkingLaptopWhileSittingChair from "../../assets/332b003c75249e55dce189cba573b1ad5398e39f.png";
import imgR21 from "../../assets/rig.png";
import CactusPlant from "./CactusPlant";
import HRMS from "../../assets/81345320173.png";
import { API } from "../../Components/Apis";
import { useNavigate } from "react-router-dom";

function decodeToken(token) {
  try {
    if (!token) return null;

    // JWT format: header.payload.signature
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    // Base64URL → Base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Decode
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

export default function NewPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [againPassword, setAgainPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAgainPassword, setShowAgainPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== againPassword) {
      setError("Passwords do not match");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Session expired. Please login again.");
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded || !decoded.sub) {
      setError("Invalid session. Please login again.");
      return;
    }

    const user_id = Number(decoded.sub);

    setIsLoading(true);

    try {
      const response = await fetch(API.changePassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("BACKEND ERROR:", data);

        throw new Error(data.detail[0].msg || "Failed to update password");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[rgba(255,255,255,0.95)] to-[rgba(176,41,0,0.37)] flex items-center justify-center p-2 md:p-4 relative overflow-hidden">
      {/* background elements unchanged */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hidden lg:block absolute left-0 bottom-0 w-115 h-120 opacity-80">
          <img
            src={imgCharacterWorkingLaptopWhileSittingChair}
            alt=""
            className="w-full h-full object-contain transform scale-y-[-1] rotate-180"
          />
        </div>
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-12 lg:bottom-12 lg:right-24">
          <CactusPlant />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-110 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 lg:p-10">
        {/* logos unchanged */}
        <div className="mb-8 md:mb-10">
          <div className="h-15 md:h-17.25 flex justify-center">
            <img src={imgR21} alt="RIG DIGITAL Logo" className="h-full" />
          </div>
          <div className="h-5 flex justify-center">
            <img src={HRMS} alt="HRMS Logo" className="h-4" />
          </div>
        </div>

        <div className="text-center mb-6 font-extrabold text-2xl text-[#990400]">
          Set New Password
        </div>

        {/* ✅ ERROR DISPLAY */}
        <div className="text-center text-red-500 mb-4 min-h-5">{error}</div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-black font-medium">New Password</label>
            <div className="relative">
              <input
                type={showAgainPassword ? "text" : "password"}
                value={againPassword}
                onChange={(e) => setAgainPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#c0dbea] rounded pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowAgainPassword(!showAgainPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showAgainPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {/* Re-enter Password */}
          <div className="space-y-2">
            <label className="block text-black font-medium">
              Re-enter Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#c0dbea] rounded pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#990400] text-white py-3 rounded-full shadow-lg"
          >
            {isLoading ? "SAVING..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

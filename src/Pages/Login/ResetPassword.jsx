/**
 * ResetPasswordPage.jsx
 *
 * Reads ?token= from the URL automatically — user never types the token.
 * Route: /reset-password?token=<jwt>
 *
 * ┌──────────────────────────────────────────────────────────────┐
 *  Add to Apis.js:
 *  ResetPassword: `${mainOrigin}/auth/reset-password`
 *
 *  POST /auth/reset-password
 *  Body: { token: string, new_password: string }
 *  Response 200: { message: "Password reset successful" }
 *  Response 400/422: { detail: "Token expired" | "Invalid token" | … }
 * └──────────────────────────────────────────────────────────────┘
 */

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, EyeOff, ArrowRight, CheckCircle, X,
  Lock, AlertCircle, Loader,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── assets — same ones used in LoginForm ─── */
import imgR21 from "../../assets/rig.png";
import HRMS   from "../../assets/81345320173.png";
import imgCharacterWorkingLaptopWhileSittingChair from "../../assets/332b003c75249e55dce189cba573b1ad5398e39f.png";
import CactusPlant from "./CactusPlant";

/* ─────────────────────────────────────────────
   Password strength rules (shown as checklist)
───────────────────────────────────────────── */
const RULES = [
  { id: "len",   test: (p) => p.length >= 8,           label: "At least 8 characters"  },
  { id: "upper", test: (p) => /[A-Z]/.test(p),         label: "One uppercase letter"   },
  { id: "lower", test: (p) => /[a-z]/.test(p),         label: "One lowercase letter"   },
  { id: "num",   test: (p) => /\d/.test(p),             label: "One number"             },
  { id: "sym",   test: (p) => /[^A-Za-z0-9]/.test(p),  label: "One special character"  },
];

function strengthScore(p) { return RULES.filter(r => r.test(p)).length; }
function strengthMeta(score) {
  if (score <= 1) return { label: "Very weak",  bar: "w-1/5",  color: "bg-red-500"    };
  if (score === 2) return { label: "Weak",       bar: "w-2/5",  color: "bg-orange-400" };
  if (score === 3) return { label: "Fair",       bar: "w-3/5",  color: "bg-yellow-400" };
  if (score === 4) return { label: "Strong",     bar: "w-4/5",  color: "bg-blue-500"   };
  return                   { label: "Very strong",bar: "w-full", color: "bg-green-500"  };
}

/* ─────────────────────────────────────────────
   JWT helpers — read token from ?token= param
───────────────────────────────────────────── */
function getTokenFromURL() {
  try {
    return new URLSearchParams(window.location.search).get("token") || null;
  } catch { return null; }
}

function decodeJWT(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch { return null; }
}

function validateToken(token) {
  if (!token) return { valid: false, reason: "missing" };
  const payload = decodeJWT(token);
  if (!payload)                                       return { valid: false, reason: "invalid"    };
  if (payload.exp && Date.now() / 1000 > payload.exp) return { valid: false, reason: "expired"    };
  if (payload.type && payload.type !== "reset")        return { valid: false, reason: "wrong_type" };
  return { valid: true, payload };
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function ResetPasswordPage() {
  const navigate    = useNavigate();
  const token       = getTokenFromURL();
  const tokenInfo   = validateToken(token);

  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState("");
  const [isSuccess,  setIsSuccess]  = useState(false);

  const score   = strengthScore(password);
  const str     = strengthMeta(score);
  const passOK  = score >= 3;
  const matchOK = confirm.length > 0 && password === confirm;

  /* ── Submit ── */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!passOK)  { setError("Password is too weak. Please meet the requirements below."); return; }
    if (!matchOK) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(API.ResetPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Request failed (${res.status})`);
      }

      setIsSuccess(true);
      /* Redirect to login after 3 s */
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token, password, confirm, passOK, matchOK, navigate]);

  /* ─────────────────────────────────────────────
     Shared page wrapper (matches LoginForm shell)
  ───────────────────────────────────────────── */
  const PageShell = ({ children }) => (
    <div className="min-h-screen bg-linear-to-br from-[rgba(255,255,255,0.95)] to-[rgba(176,41,0,0.37)] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background — identical to LoginForm */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="hidden lg:block absolute left-0 bottom-0 w-115 h-120 opacity-80">
          <img src={imgCharacterWorkingLaptopWhileSittingChair} alt=""
            className="w-full h-full object-contain transform scale-y-[-1] rotate-180" />
        </div>
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-12 lg:bottom-12 lg:right-24">
          <CactusPlant />
        </div>
      </div>
      <div className="relative z-10 w-full max-w-110">
        {children}
      </div>
    </div>
  );

  /* ─── Invalid / expired token ─── */
  if (!tokenInfo.valid) {
    const MSGS = {
      missing:    "This link is missing a reset token. Make sure you copied the full URL from your email.",
      expired:    "This password reset link has expired. Reset links are valid for a limited time. Please request a new one.",
      invalid:    "This link appears to be invalid or was tampered with. Please request a fresh password reset.",
      wrong_type: "This is not a valid password reset link. Please use the link sent to your email.",
    };
    return (
      <PageShell>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 text-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="h-14 w-full flex items-center justify-center overflow-hidden mb-1">
              <img src={imgR21} alt="RIG DIGITAL Logo" className="h-full w-auto object-contain" />
            </div>
            <div className="h-5 w-full flex items-center justify-center overflow-hidden">
              <img src={HRMS} alt="HRMS Logo" className="h-4 w-auto object-contain" />
            </div>
          </div>

          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-7 h-7 text-[#990400]" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {tokenInfo.reason === "expired" ? "Link Expired" : "Invalid Link"}
          </h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            {MSGS[tokenInfo.reason] || MSGS.invalid}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-[#990400] hover:bg-[#7a0300] text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
            Back to Login
          </button>
        </div>
      </PageShell>
    );
  }

  /* ─── Success ─── */
  if (isSuccess) {
    return (
      <PageShell>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 text-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="h-14 w-full flex items-center justify-center overflow-hidden mb-1">
              <img src={imgR21} alt="RIG DIGITAL Logo" className="h-full w-auto object-contain" />
            </div>
            <div className="h-5 w-full flex items-center justify-center overflow-hidden">
              <img src={HRMS} alt="HRMS Logo" className="h-4 w-auto object-contain" />
            </div>
          </div>

          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-gray-600 text-sm mb-1">Your password has been updated successfully.</p>
          <p className="text-gray-600 text-sm mb-6">You can now sign in with your new password.</p>
          <p className="text-gray-400 text-xs">Redirecting you to login…</p>
        </div>
      </PageShell>
    );
  }

  /* ─── Main form ─── */
  return (
    <PageShell>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 lg:p-10">

        {/* Logo — identical to LoginForm */}
        <div className="mb-8 md:mb-10">
          <div className="h-15 md:h-17 w-full flex items-center justify-center overflow-hidden">
            <img src={imgR21} alt="RIG DIGITAL Logo" className="h-full w-auto object-contain" />
          </div>
          <div className="h-5 w-full flex items-center justify-center overflow-hidden">
            <img src={HRMS} alt="HRMS Logo" className="h-4 w-auto object-contain" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1">
            Set New Password
          </h2>
          <p className="text-gray-600 text-sm">
            Choose a strong password for your account.
          </p>
        </div>

        {/* Error message — same style as LoginForm */}
        {error && (
          <div className="flex items-center justify-center overflow-hidden text-center text-red-500 mb-4">
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-black text-base font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                className="w-full px-4 py-3 bg-[#c0dbea] rounded border-0 text-sm text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#990400]/30 transition-all shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] pr-12"
                placeholder="Enter new password"
                required
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#c0dbea] hover:bg-[#a8c8d8] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#990400]/30"
                aria-label={showPass ? "Hide password" : "Show password"}>
                {showPass ? <EyeOff className="w-4 h-4 text-[#D885A3]" /> : <Eye className="w-4 h-4 text-[#D885A3]" />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Strength</span>
                  <span className={`text-xs font-semibold ${
                    score <= 2 ? "text-red-500" : score === 3 ? "text-yellow-600" : "text-green-600"
                  }`}>{str.label}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${str.bar} ${str.color}`} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-black text-base font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConf ? "text" : "password"}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(""); }}
                className={`w-full px-4 py-3 rounded border-0 text-sm text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] pr-12
                  ${confirm.length === 0
                    ? "bg-[#c0dbea] focus:ring-[#990400]/30"
                    : matchOK
                      ? "bg-[#c0dbea] focus:ring-green-400/40"
                      : "bg-[#c0dbea] focus:ring-red-400/40"}`}
                placeholder="Confirm new password"
                required
              />
              <button type="button" onClick={() => setShowConf(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#c0dbea] hover:bg-[#a8c8d8] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#990400]/30"
                aria-label={showConf ? "Hide password" : "Show password"}>
                {showConf ? <EyeOff className="w-4 h-4 text-[#D885A3]" /> : <Eye className="w-4 h-4 text-[#D885A3]" />}
              </button>
            </div>
            {confirm.length > 0 && !matchOK && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" /> Passwords do not match
              </p>
            )}
            {matchOK && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>

          {/* Requirements checklist */}
          <div className="bg-[#c0dbea]/40 rounded-xl px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Password requirements
            </p>
            {RULES.map(r => {
              const ok = r.test(password);
              return (
                <div key={r.id} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${ok ? "bg-green-500" : "bg-gray-300"}`}>
                    {ok && <CheckCircle className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-xs transition-colors ${ok ? "text-green-700 font-medium" : "text-gray-500"}`}>
                    {r.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Submit — same style as LoginForm */}
          <button
            type="submit"
            disabled={isLoading || !passOK || !matchOK}
            className="cursor-pointer w-full bg-[#990400] hover:bg-[#7a0300] text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {isLoading ? (
              <span>RESETTING...</span>
            ) : (
              <>
                <span>RESET PASSWORD</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Back to login */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="cursor-pointer text-sm text-[#990400] hover:text-[#7a0300] font-medium transition-colors underline">
              Back to Login
            </button>
          </div>

        </form>
      </div>
    </PageShell>
  );
}
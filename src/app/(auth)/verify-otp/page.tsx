"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { verifyOtp, resendOtp } from "@/redux/slice/userSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Mail, RefreshCw, CheckCircle, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const RESEND_COOLDOWN = 60; // seconds

function VerifyOtpContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  // Start resend cooldown on mount
  useEffect(() => {
    setResendTimer(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    if (!userId) {
      toast.error("Invalid verification link");
      return;
    }

    setVerifying(true);
    try {
      const result = await dispatch(verifyOtp({ userId, otp: code }));
      if (verifyOtp.fulfilled.match(result)) {
        setSuccess(true);
        toast.success("Email verified! Welcome to Sahan Research 🎉");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        const msg = result.payload as string;
        toast.error(msg || "Verification failed");
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!userId || resendTimer > 0 || resending) return;
    setResending(true);
    try {
      const result = await dispatch(resendOtp({ userId }));
      if (resendOtp.fulfilled.match(result)) {
        toast.success("A new code has been sent to your email!");
        setResendTimer(RESEND_COOLDOWN);
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      } else {
        const msg = result.payload as string;
        toast.error(msg || "Failed to resend code");
      }
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-4 max-w-md w-full border border-gray-100 dark:border-slate-800">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="text-green-500" size={44} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Email Verified!</h2>
          <p className="text-gray-500 dark:text-slate-400 text-center">
            Your account is active. Redirecting to your dashboard…
          </p>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full animate-pulse" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-500">
      <Link
        href="/login"
        className="absolute top-8 left-8 p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-all"
        title="Back to register"
      >
        <ArrowLeft size={24} />
      </Link>
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40">
            <ShieldCheck className="text-white" size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400 leading-relaxed px-4">
          We sent a 6-digit verification code to your email address. Enter it below to activate your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-10 px-4 shadow-xl shadow-indigo-100/20 dark:shadow-black/20 sm:rounded-2xl sm:px-10 border border-gray-100/50 dark:border-slate-800/50">

          {/* Email icon row */}
          <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl px-4 py-3 mb-8 border border-indigo-100 dark:border-indigo-900/50">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
              <Mail size={15} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Check your inbox — the code expires in <strong>10 minutes</strong>.
            </p>
          </div>

          {/* OTP Input Boxes */}
          <div className="flex gap-2 sm:gap-3 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-digit-${index}`}
                ref={(el) => { inputs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black rounded-xl border-2 transition-all outline-none bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white caret-indigo-500 ${
                  digit
                    ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20"
                    : "border-gray-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20"
                }`}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            id="verify-otp-submit"
            onClick={handleVerify}
            disabled={verifying || otp.join("").length < 6}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] uppercase tracking-widest"
          >
            {verifying ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying…
              </span>
            ) : "Verify Email"}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Resend code in{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {String(Math.floor(resendTimer / 60)).padStart(2, "0")}:{String(resendTimer % 60).padStart(2, "0")}
                </span>
              </p>
            ) : (
              <button
                id="resend-otp-button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending…" : "Resend verification code"}
              </button>
            )}
          </div>

          {/* Security note */}
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-slate-800 text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">
              🔒 Never share this code with anyone. Sahan Research will never ask for it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}

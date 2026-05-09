"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { loginUser } from "@/redux/slice/userSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, ArrowLeft, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    // Clear manual logout flag if it exists
    if (typeof window !== "undefined") {
      localStorage.removeItem("manual-logout");
    }
  }, []);

  useEffect(() => {
    if (!lockUntil) {
      setCountdown("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = lockUntil.getTime() - now;

      if (distance <= 0) {
        clearInterval(interval);
        setLockUntil(null);
        setCountdown("");
      } else {
        const minutes = Math.floor(distance / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockUntil) {
      toast.error(`Please wait ${countdown} before trying again.`);
      return;
    }

    if (!identifier || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ identifier, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success("Logged in successfully!");
        const user = resultAction.payload;
        if (user.role === "ADMIN") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        const errorPayload = resultAction.payload as any;
        const errorMsg = errorPayload?.message || "Login failed";
        toast.error(errorMsg);
        
        if (errorPayload?.locked && errorPayload?.lockUntil) {
          setLockUntil(new Date(errorPayload.lockUntil));
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-500">
      <Link 
        href="/" 
        className="absolute top-8 left-8 p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-all shadow-sm sm:shadow-none"
        title="Back to home"
      >
        <ArrowLeft size={24} />
      </Link>

      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/logo.jpeg" 
            alt="Sahan Research Logo" 
            className="w-16 h-16 rounded-2xl object-cover shadow-xl dark:shadow-indigo-950/50" 
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400">
          Sign in to continue your research journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-10 px-4 shadow-xl shadow-indigo-100/20 dark:shadow-black/20 sm:rounded-2xl sm:px-10 border border-gray-100/50 dark:border-slate-800/50">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Email or Phone Number</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  disabled={!!lockUntil}
                  placeholder="Enter your email or phone number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 disabled:opacity-50 transition-all outline-none font-medium text-gray-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Forgot password?</Link>
              </div>
              <div className="mt-1 relative">
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!lockUntil}
                />
              </div>
            </div>

            {lockUntil && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-3">
                <Lock className="text-red-500 dark:text-red-400 shrink-0" size={20} />
                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                  Account locked. Try again in {countdown}.
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !!lockUntil}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] uppercase tracking-widest"
              >
                {loading ? "Verifying..." : lockUntil ? "Locked" : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-gray-50 dark:border-slate-800">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              New to Sahan Research?{" "}
              <Link href="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

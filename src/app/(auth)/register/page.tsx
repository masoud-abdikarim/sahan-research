"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { registerUser } from "@/redux/slice/userSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, User, Mail, Phone, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

import { validatePassword } from "@/lib/validation";

// Strict email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

import { PasswordInput } from "@/components/PasswordInput";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address (e.g. name@domain.com)";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "email") setEmailError(validateEmail(value));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
    if (e.target.name === "email") setEmailError(validateEmail(formData.email));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, password } = formData;

    if (!name || !email || !phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      toast.error(emailErr);
      return;
    }

    const passwordErr = validatePassword(password);
    if (passwordErr) {
      toast.error(passwordErr);
      return;
    }

    try {
      const resultAction = await dispatch(registerUser(formData));
      if (registerUser.fulfilled.match(resultAction)) {
        const { userId } = resultAction.payload as any;
        toast.success("Account created! Check your email for the verification code.");
        router.push(`/verify-otp?userId=${userId}`);
      } else {
        const errorMsg = resultAction.payload as string;
        toast.error(errorMsg || "Registration failed");
      }
    } catch {
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
          Join Sahan Research
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400">
          Create your account to start your academic journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-10 px-4 shadow-xl shadow-indigo-100/20 dark:shadow-black/20 sm:rounded-2xl sm:px-10 border border-gray-100/50 dark:border-slate-800/50">
          <form className="space-y-5" onSubmit={handleRegister}>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  id="register-name"
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium text-gray-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  id="register-email"
                  required
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 transition-all outline-none font-medium text-gray-700 dark:text-slate-200 ${
                    touched.email && emailError
                      ? "border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/20 focus:border-red-500"
                      : "border-gray-100 dark:border-slate-800 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400"
                  }`}
                />
              </div>
              {touched.email && emailError && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">{emailError}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  id="register-phone"
                  required
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="appearance-none block w-full pl-10 pr-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium text-gray-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <PasswordInput
                name="password"
                id="register-password"
                placeholder="Letters and numbers only"
                value={formData.password}
                onChange={handleChange}
                showRequirements={true}
              />
            </div>

            {/* OTP info notice */}
            <div className="flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-900/50">
              <CheckCircle size={16} className="text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                A <strong>6-digit verification code</strong> will be sent to your email to confirm your account.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                id="register-submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform active:scale-[0.98] uppercase tracking-widest"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-gray-50 dark:border-slate-800">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

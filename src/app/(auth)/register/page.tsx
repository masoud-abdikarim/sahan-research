"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { registerUser } from "@/redux/slice/userSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordInput } from "@/components/PasswordInput";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, password } = formData;

    if (!name || !email || !phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const resultAction = await dispatch(registerUser(formData));
      if (registerUser.fulfilled.match(resultAction)) {
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        // Show the specific error message from the backend (e.g. "User already exists")
        const errorMsg = resultAction.payload as string;
        toast.error(errorMsg || "Registration failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium text-gray-700 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium text-gray-700 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium text-gray-700 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <PasswordInput
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
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

"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getCurrentUser } from "@/redux/slice/userSlice";
import Loader from "@/components/Loader";
import { User, Mail, Phone, Calendar, Shield, BadgeCheck, Lock, CheckCircle2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, loading, error } = useSelector((state: RootState) => state.user);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await axios.post("/api/user/change-password", {
        newPassword,
        confirmPassword,
      });

      toast.success(response.data.message || "Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && !currentUser) return <Loader />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button 
          onClick={() => dispatch(getCurrentUser())}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto transition-colors duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Manage your personal information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center transition-all hover:shadow-md dark:hover:shadow-indigo-950/10">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                <User size={48} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-100 dark:border-slate-700 shadow-lg">
                <BadgeCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 truncate mb-1">{currentUser.name}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-8">{currentUser.email}</p>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
              currentUser.role === "ADMIN" 
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" 
                : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30"
            }`}>
              {currentUser.role === "ADMIN" ? <Shield size={12} /> : <User size={12} />}
              {currentUser.role}
            </div>
          </div>
        </div>

        {/* Right Col: Details Grid */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30">
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                Personal Information
              </h3>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-200">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-purple-600 dark:text-purple-400 shadow-sm">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-200">{currentUser.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl text-amber-600 dark:text-amber-400 shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Joined Date</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-200">
                    {new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Account Role</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-slate-200 capitalize">{currentUser.role.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30 flex items-center gap-2">
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <Lock size={16} className="text-red-500 dark:text-red-400" />
                Security Settings
              </h3>
            </div>
            <div className="p-8">
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-gray-900 dark:text-slate-200 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-6 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-gray-900 dark:text-slate-200 font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-indigo-600 dark:bg-indigo-500 text-white px-10 py-4 rounded-2xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-950/50 p-6 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-500 text-center uppercase tracking-[0.2em] leading-relaxed">
              Account Security: Your information is protected by industry-standard encryption and role-based access controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

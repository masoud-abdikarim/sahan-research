"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import { User, Mail, Calendar, Phone, Hash, KeyRound, X, CheckCircle2, AlertCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import { PasswordInput } from "@/components/PasswordInput";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time filtering state
  const [filterTerm, setFilterTerm] = useState("");
  
  // Manual Reset State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/users");
      setUsers(res.data.users);
    } catch (error: any) {
      // Ignore 401 errors as they are handled globally by AxiosInterceptor
      if (error.response?.status === 401) return;

      const msg = error.response?.data?.details || error.message || "Failed to fetch users";
      console.error("User Fetch Error:", msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReset = (user: any) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setResetLoading(true);
      await axios.post("/api/admin/users/reset-password", {
        action: "reset",
        identifier: selectedUser.email, // Use email as identifier
        newPassword
      });
      toast.success(`Password for ${selectedUser.name} reset successfully`);
      setResetModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!filterTerm.trim()) return users;
    
    const term = filterTerm.toLowerCase();
    return users.filter((u) => 
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  }, [users, filterTerm]);

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Manage and monitor all system participants.</p>
        </div>

        {/* Table Filter */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Filter list by name, email..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="pl-10 pr-10 py-2.5 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-sm font-bold"
          />
          {filterTerm && (
            <button 
              onClick={() => setFilterTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left border-collapse block md:table min-w-full divide-y divide-gray-100 dark:divide-slate-800">
            <thead className="bg-gray-50/50 dark:bg-slate-950/50 hidden md:table-header-group">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Name</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Contact Info</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Enrollments</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Joined</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group bg-white dark:bg-slate-900 divide-y divide-transparent md:divide-gray-100 dark:md:divide-slate-800 space-y-4 md:space-y-0 p-4 md:p-0">
              {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                <tr key={u.id} className="block md:table-row bg-white dark:bg-slate-900 md:bg-transparent rounded-3xl border border-gray-100 dark:border-slate-800 md:border-none p-4 md:p-0 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group shadow-sm md:shadow-none">
                  <td className="block md:table-cell px-2 md:px-8 py-3 md:py-6 whitespace-nowrap">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-sm group-hover:scale-105 transition-transform">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-black text-gray-900 dark:text-slate-100">{u.name}</div>
                    </div>
                  </td>
                  <td className="block md:table-cell px-2 md:px-8 py-2 md:py-6 whitespace-nowrap">
                    <div className="flex items-center justify-between md:block">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest md:hidden">Contact Info</span>
                      <div className="space-y-1.5 text-right md:text-left flex flex-col items-end md:items-start">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                        <Mail size={14} className="text-gray-300 dark:text-slate-600" />
                        {u.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/20 w-fit px-2 py-0.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
                        <Phone size={12} className="text-indigo-400 dark:text-indigo-500" />
                        {u.phone || "No phone provided"}
                      </div>
                    </div>
                    </div>
                  </td>
                  <td className="block md:table-cell px-2 md:px-8 py-2 md:py-6 whitespace-nowrap text-center md:text-center text-right">
                    <div className="flex items-center justify-between md:justify-center">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest md:hidden">Enrollments</span>
                      <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-inner">
                        <Hash size={14} className="text-gray-400 dark:text-slate-600" />
                        <span className="text-sm font-black text-gray-900 dark:text-slate-100">{u._count?.enrollments || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="block md:table-cell px-2 md:px-8 py-2 md:py-6 whitespace-nowrap">
                    <div className="flex items-center justify-between md:justify-start gap-2 text-sm text-gray-500 dark:text-slate-400 font-bold">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest md:hidden">Joined</span>
                      <div className="flex items-center gap-2 text-right md:text-left">
                        <Calendar size={14} className="text-gray-300 dark:text-slate-600" />
                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </td>
                  <td className="block md:table-cell px-2 md:px-8 py-4 md:py-6 whitespace-nowrap text-right md:border-none border-t border-gray-50 dark:border-slate-800 mt-2 md:mt-0">
                    <div className="flex items-center justify-end md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenReset(u)}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 shadow-sm opacity-0 group-hover:opacity-100"
                      title="Reset Password"
                    >
                      <KeyRound size={18} />
                    </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 dark:text-slate-600 italic font-medium">
                    {filterTerm ? (
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="text-gray-300 dark:text-slate-700" />
                        <span>No users found matching "{filterTerm}"</span>
                      </div>
                    ) : "No participants registered in the system yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <KeyRound className="text-indigo-600" size={20} />
                Reset Password
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="mb-8 p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-sm">
                      {selectedUser.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <p className="text-sm font-black text-gray-900 dark:text-slate-100">{selectedUser.name}</p>
                      <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tighter">{selectedUser.email}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-3 pt-3 border-t border-indigo-100/50 dark:border-indigo-900/30">
                   <AlertCircle size={12} />
                   Admin Override Mode
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="px-6 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-gray-900 dark:text-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="px-6 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-gray-900 dark:text-slate-200 font-bold"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-2 px-8 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


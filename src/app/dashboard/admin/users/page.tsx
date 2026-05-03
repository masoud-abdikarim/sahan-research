"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import { User, Mail, Calendar, Phone, Hash } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/admin/users");
        setUsers(res.data.users);
      } catch (error: any) {
        const msg = error.response?.data?.details || error.message || "Failed to fetch users";
        console.error("User Fetch Error:", msg);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">User Management</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Manage and monitor all system participants.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
            <thead className="bg-gray-50/50 dark:bg-slate-950/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Name</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Contact Info</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center">Enrollments</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
              {users.length > 0 ? users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all group">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-sm group-hover:scale-105 transition-transform">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-black text-gray-900 dark:text-slate-100">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                        <Mail size={14} className="text-gray-300 dark:text-slate-600" />
                        {u.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/20 w-fit px-2 py-0.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
                        <Phone size={12} className="text-indigo-400 dark:text-indigo-500" />
                        {u.phone || "No phone provided"}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-slate-950 px-4 py-2 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-inner">
                        <Hash size={14} className="text-gray-400 dark:text-slate-600" />
                        <span className="text-sm font-black text-gray-900 dark:text-slate-100">{u._count?.enrollments || 0}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 font-bold">
                      <Calendar size={14} className="text-gray-300 dark:text-slate-600" />
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-400 dark:text-slate-600 italic font-medium">No participants registered in the system yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

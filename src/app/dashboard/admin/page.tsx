"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import { Users, BookOpen, Clock, DollarSign, TrendingUp } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/admin/stats");
        setStats(res.data.stats);
      } catch (error) {
        console.error("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  // Safety fallback
  const displayStats = stats || {
    totalUsers: 0,
    totalCourses: 0,
    pendingEnrollments: 0,
    totalRevenue: 0
  };

  const statCards = [
    { label: "Total Students", value: displayStats.totalUsers, icon: Users, color: "bg-blue-500" },
    { label: "Active Courses", value: displayStats.totalCourses, icon: BookOpen, color: "bg-indigo-500" },
    { label: "Pending Approvals", value: displayStats.pendingEnrollments, icon: Clock, color: "bg-amber-500" },
    { label: "Total Revenue", value: `$${(displayStats.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "bg-emerald-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto transition-colors duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">System Overview</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Real-time metrics for your learning management system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md dark:hover:shadow-indigo-900/10 transition-all">
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-indigo-100 dark:shadow-black/20`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Platform Growth</h2>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4 font-medium">You have {displayStats.totalUsers} registered users across the platform.</p>
          <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" 
              style={{ width: `${Math.min((displayStats.totalUsers / 100) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-widest">Target: 100 Students</p>
        </div>

        <div className="bg-indigo-600 dark:bg-indigo-900 p-8 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-black/20 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Quick Actions</h2>
            <p className="text-indigo-100 dark:text-indigo-200 text-sm mb-6 opacity-90">Common tasks for system management.</p>
            <div className="grid grid-cols-2 gap-3">
              <a href="/dashboard/admin/enrollments" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center border border-white/10">
                Review Requests
              </a>
              <a href="/dashboard/courses" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center border border-white/10">
                Add New Course
              </a>
              <a href="/dashboard/admin/users" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center border border-white/10">
                View Users
              </a>
              <a href="/dashboard/lessons" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center border border-white/10">
                Manage Lessons
              </a>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}

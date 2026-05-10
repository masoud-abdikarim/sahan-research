"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import { Users, BookOpen, Clock, DollarSign, TrendingUp, CheckCircle2, XCircle, BookOpenCheck, Award, Percent } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Don't fetch if we don't have a user yet or they aren't admin
      // The layout handles the session fetch
      try {
        const res = await axios.get("/api/admin/stats");
        setStats(res.data.stats);
      } catch (error: any) {
        // If it's a 401/403, the interceptor will handle it
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          console.error("Failed to fetch stats");
        }
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
    totalRevenue: 0,
    studentsPassed: 0,
    studentsFailed: 0,
    studentsStudying: 0,
    completedModules: 0,
    certRequests: 0,
    averageMarks: 0
  };

  const mainCards = [
    { label: "Total Students", value: displayStats.totalUsers, icon: Users, color: "bg-blue-500" },
    { label: "Active Courses", value: displayStats.totalCourses, icon: BookOpen, color: "bg-indigo-500" },
    { label: "Pending Approvals", value: displayStats.pendingEnrollments, icon: Clock, color: "bg-amber-500" },
    { label: "Total Revenue", value: `$${(displayStats.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "bg-emerald-500" },
  ];

  const advancedCards = [
    { label: "Passed Courses", value: displayStats.studentsPassed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
    { label: "Failed Courses", value: displayStats.studentsFailed, icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/20" },
    { label: "Actively Studying", value: displayStats.studentsStudying, icon: BookOpenCheck, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/20" },
    { label: "Modules Completed", value: displayStats.completedModules, icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-500/20" },
    { label: "Cert Requests", value: displayStats.certRequests, icon: Award, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20" },
    { label: "Platform Avg Marks", value: `${displayStats.averageMarks}%`, icon: Percent, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-500/20" },
  ];

  return (
    <div className="max-w-7xl mx-auto transition-colors duration-500 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">System Overview</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Real-time metrics for your learning management system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {mainCards.map((stat, i) => {
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

      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Advanced Analytics</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-12">
        {advancedCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-full mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
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
              <a href="/dashboard/admin/students" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center border border-emerald-500 text-emerald-300">
                Manage Students
              </a>
              <a href="/dashboard/courses" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center border border-white/10">
                Manage Courses
              </a>
              <a href="/dashboard/admin/exams" className="bg-white/10 hover:bg-white/20 p-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center border border-white/10">
                Manage Exams
              </a>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}

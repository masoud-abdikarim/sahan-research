"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getDashboardStats } from "@/redux/slice/dashboardSlice";
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  GraduationCap,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/Loader";

export default function StudentDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, loading } = useSelector((state: RootState) => state.dashboard);
  const { currentUser } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  if (loading && stats.totalCourses === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const statCards = [
    {
      name: "Enrolled Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      name: "Active Courses",
      value: stats.activeCourses,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      name: "Completed Courses",
      value: stats.completedCourses,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      name: "Lessons Completed",
      value: stats.lessonsCompleted,
      icon: GraduationCap,
      color: "text-indigo-600",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-sans pb-20">
      {/* ── WELCOME HEADER ── */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-indigo-600 p-10 sm:p-16 text-white shadow-2xl shadow-indigo-500/20 dark:shadow-none border-[6px] border-indigo-500/10">
        <div className="relative z-10 max-w-3xl">
           <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-1.5 rounded-full bg-indigo-500/30 backdrop-blur-md border border-indigo-400/30 text-[10px] font-black uppercase tracking-[0.2em]">
                 Academic Session 2026/27
              </div>
              <span className="w-8 h-px bg-indigo-400/50"></span>
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Student Portal</span>
           </div>
           
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter leading-tight">
            Welcome back,<br/>{currentUser?.name || "Scholar"}! 👋
          </h1>
          
          <p className="text-indigo-100/90 text-xl mb-10 leading-relaxed font-medium max-w-xl">
            You are currently enrolled in <span className="text-white font-black">{stats.activeCourses} active courses tracks</span>. Your academic progress is looking excellent this month.
          </p>
          
          <div className="flex flex-wrap gap-5">
            <Link 
              href="/dashboard/enrollments"
              className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-black/10 hover:-translate-y-1 flex items-center gap-3 group"
            >
              Resume Learning
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
          </div>
        </div>
        
        {/* Decorative Background Patterns */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[100px] opacity-40 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-700 rounded-full blur-[80px] opacity-30 pointer-events-none" />
        <img src="/logo.jpeg" alt="" className="absolute right-12 bottom-12 w-48 h-48 opacity-[0.07] grayscale invert pointer-events-none" />
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, idx) => (
          <div 
            key={stat.name}
            style={{ animationDelay: `${idx * 100}ms` }}
            className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <div className="flex flex-col gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-lg shadow-black/5`}>
                <stat.icon size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.name}</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</p>
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">+2.4%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── EMPTY STATE ── */}
      {stats.totalCourses === 0 && (
        <div className="bg-white dark:bg-slate-900 border-[3px] border-dashed border-gray-100 dark:border-slate-800 rounded-[3.5rem] p-20 text-center max-w-2xl mx-auto shadow-2xl shadow-indigo-500/5 dark:shadow-none">
          <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <BookOpen size={48} className="text-gray-300 dark:text-slate-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Academic Journey Pending</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-10 text-lg font-medium leading-relaxed">
            You haven't initiated any research enrollments yet. Our curriculum is ready for your exploration.
          </p>
          <Link 
            href="/dashboard/active-courses"
            className="inline-flex items-center justify-center bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-1 transition-all"
          >
            Explore Curriculum
          </Link>
        </div>
      )}

      {/* ── SECONDARY MODULES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Academic Milestones */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Academic Milestones</h3>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">View Roadmap</span>
           </div>
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-gray-50/50 dark:bg-slate-800/30 rounded-[2rem] border border-gray-50 dark:border-slate-800 transition-all hover:border-indigo-100 dark:hover:border-indigo-900/30">
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-md text-2xl">
                🧪
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900 dark:text-white text-lg tracking-tight leading-none mb-1">Scientific Methodology</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recommended Milestone</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                 <ArrowRight size={18} />
              </div>
            </div>
            
            <div className="flex items-center gap-6 p-6 bg-gray-50/30 dark:bg-slate-800/20 rounded-[2rem] border border-transparent opacity-50 grayscale">
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm text-2xl">
                🔐
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-500 dark:text-slate-400 text-lg tracking-tight leading-none mb-1">Advanced Statistical Analysis</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prerequisite: Intro to Stats</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400">
                 <Clock size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Support */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden flex flex-col">
          {/* Subtle background decoration */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex-1">
            <h3 className="text-2xl font-black mb-4 tracking-tight uppercase">Support & Guidance</h3>
            <p className="text-indigo-100/90 text-lg font-medium leading-relaxed mb-10">
              Our academic advisors are available 24/7 to assist with your research methodology and technical inquiries.
            </p>
          </div>
          
          <button className="relative z-10 w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3">
            Open Support Channel
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
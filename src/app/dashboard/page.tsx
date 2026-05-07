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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 sm:p-12 text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
            Welcome back, {currentUser?.name || "Student"}! 👋
          </h1>
          <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
            Ready to continue your research journey? You have {stats.activeCourses} active courses waiting for you to complete.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/dashboard/enrollments"
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 group"
            >
              My Learning
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard/active-courses"
              className="bg-indigo-500 text-white border border-indigo-400 px-6 py-3 rounded-xl font-bold hover:bg-indigo-400 transition-colors"
            >
              Browse New Courses
            </Link>
          </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-0 translate-y-24 translate-x-12 w-96 h-96 bg-indigo-700 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div 
            key={stat.name}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.name}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Empty State / CTA */}
      {stats.totalCourses === 0 && (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No active enrollments yet</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8">
            You haven't enrolled in any courses. Explore our catalog and start your learning journey today!
          </p>
          <Link 
            href="/dashboard/active-courses"
            className="inline-flex items-center justify-center bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-1 transition-all"
          >
            Explore Courses
          </Link>
        </div>
      )}

      {/* Quick Access Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Learning Goals</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                📚
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">Complete Research 101</p>
                <p className="text-sm text-gray-500">Suggested for your current level</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl opacity-60">
              <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm text-gray-400">
                🔒
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-400">Advanced Data Analysis</p>
                <p className="text-sm text-gray-400">Unlock by completing prerequisites</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 p-8 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Need Help?</h3>
          <p className="text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
            Our academic advisors are available to help you navigate your research journey.
          </p>
          <button className="w-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 py-4 rounded-2xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
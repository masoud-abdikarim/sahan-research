"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getDashboardStats } from "@/redux/slice/dashboardSlice";
import { BookOpen, Users, TrendingUp } from "lucide-react";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { stats, loading, error } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  if (!currentUser) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome back, {currentUser.name}!</h2>
        <p className="text-gray-500">
          Role: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{currentUser.role}</span>
        </p>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
          <p>Failed to load dashboard statistics: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Total Courses", val: stats.totalCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100" },
            { title: "Active Enrollments", val: stats.activeEnrollments, icon: Users, color: "text-green-600", bg: "bg-green-100" },
            { title: "Lessons Completed", val: stats.lessonsCompleted, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-6 flex items-center gap-4">
                <div className={`${stat.bg} p-4 rounded-xl`}>
                  <Icon size={24} className={stat.color} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.val}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

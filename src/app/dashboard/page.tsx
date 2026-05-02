"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getDashboardStats } from "@/redux/slice/dashboardSlice";
import { BookOpen, Flame, CheckCircle, TrendingUp } from "lucide-react";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { stats, loading, error } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  if (!currentUser) return null;

  const statItems = [
    { title: "Enrolled Courses", val: stats.totalCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Learning", val: stats.activeCourses, icon: Flame, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Completed Courses", val: stats.completedCourses, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Lessons Done", val: stats.lessonsCompleted, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-xl mb-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-2">Welcome back, {currentUser.name}!</h1>
          <p className="text-indigo-100 text-lg opacity-90">
            You're currently enrolled in <span className="font-bold">{stats.totalCourses}</span> courses. Keep up the great work!
          </p>
          <div className="mt-6">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
              Student Profile
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="text-indigo-600" />
        Your Learning Metrics
      </h2>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 shadow-sm">
          <p className="font-bold">Error Loading Stats</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
                <div className={`${stat.bg} p-4 rounded-2xl`}>
                  <Icon size={28} className={stat.color} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stat.val}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Course Progress Overview</h3>
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between text-sm font-bold mb-2 text-gray-600">
                    <span>Overall Completion</span>
                    <span>{stats.totalCourses > 0 ? Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0}%</span>
                  </div>
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                      style={{ width: `${stats.totalCourses > 0 ? (stats.completedCourses / stats.totalCourses) * 100 : 0}%` }}
                    ></div>
                  </div>
               </div>
               <p className="text-gray-500 text-sm italic">
                 Finish your <span className="font-bold text-indigo-600">{stats.activeCourses} active courses</span> to boost your score!
               </p>
            </div>
        </div>
        
        <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 flex flex-col justify-center text-center">
            <CheckCircle className="mx-auto text-indigo-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Goal Check</h3>
            <p className="text-gray-600 text-sm mb-6">You have mastered {stats.completedCourses} courses so far. Set a new goal for this month!</p>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Set Study Goal
            </button>
        </div>
      </div>
    </div>
  );
}

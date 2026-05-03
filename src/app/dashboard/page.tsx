"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getDashboardStats } from "@/redux/slice/dashboardSlice";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { BookOpen, Flame, CheckCircle, TrendingUp, ArrowRight, PlayCircle } from "lucide-react";
import Loader from "@/components/Loader";
import Link from "next/link";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { stats, loading: statsLoading, error: statsError } = useSelector((state: RootState) => state.dashboard);
  const { enrollments, loading: enrollLoading } = useSelector((state: RootState) => state.enrollment);

  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getUserEnrollments());
  }, [dispatch]);

  if (!currentUser) return null;

  const approvedEnrollments = enrollments.filter(e => e.status === "APPROVED");
  const loading = statsLoading || enrollLoading;

  const statItems = [
    { title: "Enrolled Courses", val: stats.totalCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Learning", val: stats.activeCourses, icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Completed Courses", val: stats.completedCourses, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { title: "Total Lessons Done", val: stats.lessonsCompleted, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-500">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 dark:from-indigo-900 dark:via-indigo-950 dark:to-slate-900 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 dark:shadow-black/50 mb-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-widest mb-6">
            Student Dashboard
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">Welcome back, {currentUser.name}!</h1>
          <p className="text-indigo-100 dark:text-slate-300 text-lg opacity-90 leading-relaxed">
            You've completed <span className="font-black text-white">{stats.lessonsCompleted} lessons</span> so far. 
            Ready to continue your research journey?
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/dashboard/progress" className="bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white px-8 py-3.5 rounded-2xl font-black hover:bg-indigo-50 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-black/10 flex items-center gap-2 group">
              Continue Learning
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 -ml-20 -mb-20 w-60 h-60 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {statItems.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-6 flex items-center gap-5 shadow-sm hover:shadow-xl dark:hover:shadow-indigo-950/20 hover:-translate-y-1 transition-all duration-300">
              <div className={`${stat.bg} dark:bg-opacity-10 p-4 rounded-2xl`}>
                <Icon size={28} className={stat.color} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{stat.title}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stat.val}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Progress Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="text-indigo-600 dark:text-indigo-400" />
              Course Progress
            </h2>
            <Link href="/dashboard/progress" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">View All</Link>
          </div>

          {loading ? (
            <Loader />
          ) : approvedEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {approvedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-indigo-950/10 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                        {enrollment.course?.imageUrl ? (
                          <img src={enrollment.course.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-300 dark:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 font-black">
                            {enrollment.course?.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-slate-100 leading-none">{enrollment.course?.name}</h4>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">
                          {enrollment.completedLessons} of {enrollment.totalLessons} Lessons Completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-xs font-black px-3 py-1 rounded-full ${enrollment.isCompleted ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'}`}>
                         {enrollment.isCompleted ? 'Completed' : `${enrollment.progressPercentage}%`}
                       </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-100 dark:bg-slate-800">
                      <div 
                        style={{ width: `${enrollment.progressPercentage}%` }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${enrollment.isCompleted ? 'bg-green-500' : 'bg-indigo-600 dark:bg-indigo-500'}`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-800 text-center">
              <BookOpen className="mx-auto text-gray-300 dark:text-slate-700 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No active courses</h3>
              <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">Enroll in a course and wait for approval to start tracking your progress.</p>
              <Link href="/dashboard/active-courses" className="inline-block mt-6 bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs">Browse Catalog</Link>
            </div>
          )}
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-8">
          <div className="bg-indigo-50 dark:bg-indigo-950/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 text-center relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 dark:shadow-black/50 transition-transform group-hover:scale-110 duration-500">
                  <CheckCircle className="text-indigo-600 dark:text-indigo-400" size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Mastery Score</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">You have mastered <span className="font-black text-indigo-600 dark:text-indigo-400">{stats.completedCourses} courses</span> so far. Consistency is key to academic success!</p>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-6">
                   <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Overall Progress</p>
                   <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                     {stats.totalCourses > 0 ? Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0}%
                   </p>
                </div>
                <Link href="/dashboard/progress" className="block bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-950/50 uppercase tracking-widest text-xs">
                  Resume Learning
                </Link>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <div className="space-y-3">
              {[
                { label: "My Learning", href: "/dashboard/enrollments" },
                { label: "Active Courses", href: "/dashboard/active-courses" },
                { label: "Account Settings", href: "/dashboard/settings" },
              ].map(link => (
                <Link key={link.label} href={link.href} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all group">
                  <span className="text-sm font-bold text-gray-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{link.label}</span>
                  <ArrowRight size={16} className="text-gray-300 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

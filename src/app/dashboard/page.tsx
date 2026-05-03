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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 mb-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-white border border-white/30 uppercase tracking-widest mb-6">
            Student Dashboard
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">Welcome back, {currentUser.name}!</h1>
          <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">
            You've completed <span className="font-black text-white">{stats.lessonsCompleted} lessons</span> so far. 
            Ready to continue your research journey?
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/dashboard/progress" className="bg-white text-indigo-600 px-8 py-3.5 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl shadow-black/10 flex items-center gap-2 group">
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
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center gap-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`${stat.bg} p-4 rounded-2xl`}>
                <Icon size={28} className={stat.color} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{stat.val}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Progress Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <TrendingUp className="text-indigo-600" />
              Course Progress
            </h2>
            <Link href="/dashboard/progress" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
          </div>

          {loading ? (
            <Loader />
          ) : approvedEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {approvedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {enrollment.course?.imageUrl ? (
                          <img src={enrollment.course.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-indigo-300 bg-indigo-50 font-black">
                            {enrollment.course?.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 leading-none">{enrollment.course?.name}</h4>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                          {enrollment.completedLessons} of {enrollment.totalLessons} Lessons Completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-xs font-black px-3 py-1 rounded-full ${enrollment.isCompleted ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                         {enrollment.isCompleted ? 'Completed' : `${enrollment.progressPercentage}%`}
                       </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-100">
                      <div 
                        style={{ width: `${enrollment.progressPercentage}%` }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${enrollment.isCompleted ? 'bg-green-500' : 'bg-indigo-600'}`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
              <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900">No active courses</h3>
              <p className="text-gray-500 mt-2 max-w-xs mx-auto">Explore our catalog and enroll in a course to start tracking your progress.</p>
              <Link href="/" className="inline-block mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all">Browse Catalog</Link>
            </div>
          )}
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-8">
          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 text-center relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 transition-transform group-hover:scale-110 duration-500">
                  <CheckCircle className="text-indigo-600" size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Mastery Score</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">You have mastered <span className="font-black text-indigo-600">{stats.completedCourses} courses</span> so far. Consistency is key to academic success!</p>
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 mb-6">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Overall Progress</p>
                   <p className="text-3xl font-black text-indigo-600">
                     {stats.totalCourses > 0 ? Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0}%
                   </p>
                </div>
                <Link href="/dashboard/progress" className="block bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">
                  Resume Learning
                </Link>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-3">
              {[
                { label: "My Enrollments", href: "/dashboard/enrollments" },
                { label: "Browse Courses", href: "/" },
                { label: "Account Settings", href: "/dashboard/settings" },
              ].map(link => (
                <Link key={link.label} href={link.href} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                  <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-600">{link.label}</span>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

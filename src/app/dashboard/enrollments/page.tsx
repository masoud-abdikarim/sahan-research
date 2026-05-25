"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUserEnrollments, enrollCourse, approveEnrollment } from "@/redux/slice/enrollmentSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import CourseCard from "@/components/CourseCard";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Calendar, GraduationCap, ArrowRight, BookOpen } from "lucide-react";

export default function EnrollmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading: enrollLoading } = useSelector((state: RootState) => state.enrollment);
  const { courses, loading: coursesLoading } = useSelector((state: RootState) => state.course);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    dispatch(getCourses());
    if (currentUser) {
      dispatch(getUserEnrollments());
    }
  }, [dispatch, currentUser]);

  const handleEnroll = (courseId: number) => {
    if (currentUser) {
      dispatch(enrollCourse(courseId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "APPROVED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30"><CheckCircle size={12}/> Approved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30"><XCircle size={12}/> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"><Clock size={12}/> Pending</span>;
    }
  };

  const activeEnrollments = enrollments.filter(e => e.status === "APPROVED" && !e.isCompleted);
  const pendingOrRejected = enrollments.filter(e => e.status !== "APPROVED");
  const unrolledCourses = courses.filter(c => !enrollments.some(e => e.courseId === c.id));

  return (
    <div className="max-w-7xl mx-auto transition-colors duration-500 pb-20 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-8 pt-8 px-4">
        <div>
           <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                 <GraduationCap size={16} />
              </div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Learning Management</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter leading-tight">My Academic Journey</h1>
           <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">
            {isAdmin 
              ? "Administrator Access: Viewing institutional learning activity." 
              : "Track your research progress, certifications, and active enrollments."}
           </p>
        </div>
        {isAdmin && (
           <Link 
             href="/dashboard/admin/enrollments" 
             className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-sm flex items-center gap-2"
           >
             Admin Portal Control
             <ArrowRight size={14} />
           </Link>
        )}
      </div>

      {/* ── ACTIVE RESEARCH ── */}
      <div className="mb-24 px-4">
        <div className="flex items-center gap-4 mb-10">
           <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Research</h2>
           <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        </div>

        {enrollLoading ? (
           <div className="flex justify-center py-20"><Loader /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {activeEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              if (!course) return null;
              return (
                <div key={enrollment.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <CourseCard 
                    course={course} 
                    actionLabel="Resume Research"
                    onAction={() => window.location.href = `/dashboard/lessons?courseId=${course.id}`} 
                    secondaryActionLabel="Curriculum Info"
                    onSecondaryAction={() => window.location.href = `/courses/${course.id}`}
                    onCardClick={() => window.location.href = `/courses/${course.id}`}
                  />
                </div>
              );
            })}
            {activeEnrollments.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 text-gray-300 dark:text-slate-600">
                   <BookOpen size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">No Active Studies</h3>
                <p className="text-gray-500 dark:text-slate-500 font-medium text-lg max-w-sm mx-auto mb-10">You aren't currently participating in any active research tracks. Explore our catalog to begin.</p>
                {!isAdmin && (
                  <div className="flex gap-4 justify-center">
                    <Link 
                      href="/dashboard/active-courses" 
                      className="bg-indigo-600 dark:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all hover:-translate-y-1"
                    >
                      Browse Academic Catalog
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── APPLICATION STATUS ── */}
      {!isAdmin && pendingOrRejected.length > 0 && (
        <div className="px-4 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="flex items-center gap-4 mb-10">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Institutional Requests</h2>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
           </div>
           
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-gray-50/50 dark:bg-slate-800/50">
                       <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Research Program</th>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Request Date</th>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Institution Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {pendingOrRejected.map((enrollment) => (
                       <tr key={enrollment.id} className="group hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                                   {enrollment.course?.name?.charAt(0) || "R"}
                                </div>
                                <div>
                                   <p className="font-black text-gray-900 dark:text-white leading-none mb-1">{enrollment.course?.name || "Academic Track"}</p>
                                   <p className="text-xs text-gray-500 dark:text-slate-500 font-bold uppercase tracking-widest">Institutional Research</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">
                                <Calendar size={14} className="text-indigo-400" />
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                             </div>
                          </td>
                          <td className="px-8 py-8">
                             {getStatusBadge(enrollment.status)}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
}

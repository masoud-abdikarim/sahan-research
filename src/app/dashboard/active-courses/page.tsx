"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUserEnrollments, enrollCourse } from "@/redux/slice/enrollmentSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import { CheckCircle, XCircle, Clock, Calendar, BookOpen, GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function ActiveCoursesPage() {
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

  const pendingEnrollments = enrollments.filter(e => e.status === "PENDING");
  const rejectedEnrollments = enrollments.filter(e => e.status === "REJECTED");
  const unrolledCourses = courses.filter(c => !enrollments.some(e => e.courseId === c.id));

  return (
    <div className="max-w-7xl mx-auto transition-colors duration-500 pb-32">
      {/* ── HEADER ── */}
      <div className="mb-16">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Academic Catalog</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">
          {isAdmin 
            ? "Manage and review all system courses and enrollment requests." 
            : "Explore new research opportunities and track your pending applications."}
        </p>
      </div>

      {/* ── SECTION 1: PENDING REQUESTS (Full Width Row) ── */}
      {!isAdmin && (pendingEnrollments.length > 0 || rejectedEnrollments.length > 0) && (
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-amber-900/30">
                <Clock size={20} />
             </div>
             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Your Enrollment Requests</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              return (
                <div key={enrollment.id} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 shadow-xl shadow-amber-500/5 dark:shadow-none transition-all">
                  <div className="flex flex-col gap-4 mb-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                        <Clock size={12}/> Pending Approval
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{course?.name || `Course #${enrollment.courseId}`}</h3>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-50 dark:border-slate-800/50">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar size={12} className="text-indigo-500" /> Submitted {new Date(enrollment.createdAt).toLocaleDateString()}</span>
                      <span>ID: {enrollment.id}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">This course will appear in your "My Learning" dashboard once approved by the administrator.</p>
                  </div>
                </div>
              );
            })}

            {rejectedEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              return (
                <div key={enrollment.id} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-sm transition-all grayscale opacity-80 hover:grayscale-0 hover:opacity-100">
                  <div className="flex flex-col gap-4 mb-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                        <XCircle size={12}/> Request Rejected
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{course?.name || `Course #${enrollment.courseId}`}</h3>
                  </div>

                  <div className="pt-6 border-t border-gray-50 dark:border-slate-800/50 text-center">
                    <p className="text-xs text-red-500 font-bold mb-4">The enrollment request was not successful.</p>
                    <button 
                       onClick={() => handleEnroll(enrollment.courseId)}
                       className="w-full py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all"
                    >
                      Re-apply for Enrollment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SECTION 2: AVAILABLE CATALOG (New Layout) ── */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                <GraduationCap size={20} />
             </div>
             <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Available for Enrollment</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-green-500" />
            Institution Verified Modules
          </div>
        </div>

        {coursesLoading ? (
          <div className="flex justify-center py-20"><Loader /></div>
        ) : unrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {unrolledCourses.map(course => (
              <div key={course.id} className="group flex flex-col sm:flex-row bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                {/* Course Image Side */}
                <div className="w-full sm:w-56 h-48 sm:h-auto relative overflow-hidden shrink-0">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-200 dark:text-indigo-800 font-black text-4xl">
                      {course.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:hidden"></div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-50 dark:border-indigo-900/30 shadow-sm">
                      {course.category}
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="p-6 flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{course.durationMonths} Months Program</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Fee:</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">${course.price}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{course.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">{course.description}</p>
                  
                  <div className="mt-auto flex items-center gap-3">
                    {isAdmin ? (
                      <div className="w-full text-center bg-gray-50 dark:bg-slate-800 py-2.5 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 dark:border-slate-700">Admin Management</div>
                    ) : (
                      <button 
                        onClick={() => handleEnroll(course.id)}
                        className="w-full group/btn relative overflow-hidden flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50"
                      >
                        Enroll Now
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-gray-200 dark:border-slate-800">
             <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-400 dark:text-indigo-600">
                <BookOpen size={40} />
             </div>
             <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">You're All Set!</h3>
             <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto font-medium">You have requested enrollment in all our current research programs. Check your requests above for status updates.</p>
          </div>
        )}
      </section>
    </div>
  );
}

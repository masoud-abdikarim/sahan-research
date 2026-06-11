"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { enrollCourse } from "@/redux/slice/enrollmentSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import CourseCard from "@/components/CourseCard";
import ConfirmModal from "@/components/ConfirmModal";
import { CheckCircle, XCircle, Clock, Calendar, BookOpen, GraduationCap, ArrowRight, ShieldCheck, Zap, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function ActiveCoursesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading: enrollLoading, initialized: enrollInitialized } = useSelector((state: RootState) => state.enrollment);
  const { courses, loading: coursesLoading } = useSelector((state: RootState) => state.course);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = (currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN");

  const [confirmEnrollCourseId, setConfirmEnrollCourseId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  const handleEnrollClick = (courseId: number) => {
    if (currentUser) {
      setConfirmEnrollCourseId(courseId);
    } else {
      toast.error("You must be logged in to enroll.");
    }
  };

  const confirmEnroll = async () => {
    if (confirmEnrollCourseId !== null && currentUser) {
      await dispatch(enrollCourse(confirmEnrollCourseId));
      setConfirmEnrollCourseId(null);
    }
  };

  const pendingEnrollments = enrollments.filter(e => e.status === "PENDING");
  const rejectedEnrollments = enrollments.filter(e => e.status === "REJECTED");
  const unrolledCourses = courses.filter(c => !enrollments.some(e => e.courseId === c.id));

  // Check if student has an active (approved + not completed) enrollment
  const hasActiveEnrollment = !isAdmin && enrollments.some(
    e => e.status === "APPROVED" && !e.isCompleted
  );

  return (
    <div className="max-w-7xl mx-auto transition-colors duration-500 pb-32 font-sans">
      {/* ── HEADER ── */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <BookOpen size={20} />
           </div>
           <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Academic Catalog</span>
        </div>
        <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-tight">Master Your Future</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium text-lg max-w-2xl">
          {isAdmin 
            ? "Manage and review all system courses and enrollment requests across the platform." 
            : "Explore world-class research programs and track your professional academic journey."}
        </p>
      </div>

      {/* ── SECTION 1: PENDING REQUESTS ── */}
      {!isAdmin && (pendingEnrollments.length > 0 || rejectedEnrollments.length > 0) && (
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-10">
             <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Applications</h2>
             <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
             <div className="px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30 shadow-sm">
                Action Required
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              return (
                <div key={enrollment.id} className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 shadow-2xl shadow-amber-500/5 dark:shadow-none transition-all hover:-translate-y-1">
                  <div className="flex flex-col gap-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                         <Clock size={24} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">#{enrollment.id}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">{course?.name || `Program #${enrollment.courseId}`}</h3>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="fill-amber-600" /> Awaiting Institutional Review
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-gray-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3 text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                       <Calendar size={14} className="text-indigo-500" /> 
                       <span>Submitted {new Date(enrollment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-start gap-3">
                       <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                         Once approved, this course will automatically appear in your active learning dashboard.
                       </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {rejectedEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              return (
                <div key={enrollment.id} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-sm transition-all grayscale opacity-80 hover:grayscale-0 hover:opacity-100">
                  <div className="flex flex-col gap-6 mb-6">
                    <div className="flex items-center justify-between">
                       <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                          <XCircle size={24} />
                       </div>
                       <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Rejected</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{course?.name || `Program #${enrollment.courseId}`}</h3>
                  </div>

                  <div className="pt-8 border-t border-gray-50 dark:border-slate-800/50">
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-6 text-center">Enrollment Eligibility Not Met</p>
                    <button 
                       onClick={() => handleEnrollClick(enrollment.courseId)}
                       className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                      Retry Enrollment <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SECTION 2: AVAILABLE CATALOG (hidden when student has active enrollment) ── */}
      {!hasActiveEnrollment && (
      <section>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Academic Library</h2>
             <div className="h-px w-24 bg-indigo-200 dark:bg-indigo-900/50" />
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 px-5 py-2 rounded-full border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
            <ShieldCheck size={14} className="text-emerald-500" />
            Institution Verified Programs
          </div>
        </div>

        {coursesLoading ? (
          <div className="flex justify-center py-24"><Loader /></div>
        ) : unrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {unrolledCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                actionLabel={isAdmin ? undefined : "Request Enrollment"}
                onAction={isAdmin ? undefined : () => handleEnrollClick(course.id)} 
                secondaryActionLabel="Explore Details"
                onSecondaryAction={() => window.location.href = `/courses/${course.id}`}
                onCardClick={() => window.location.href = `/courses/${course.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[4rem] border border-dashed border-gray-200 dark:border-slate-800 transition-all">
             <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-950/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-indigo-600 dark:text-indigo-400">
                <BookOpen size={48} />
             </div>
             <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">You've Enrolled in All Programs!</h3>
             <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto font-medium text-lg leading-relaxed">Check your active applications above or visit your learning dashboard to start your journey.</p>
          </div>
        )}
      </section>
      )}

      <ConfirmModal
        isOpen={confirmEnrollCourseId !== null}
        title="Confirm Enrollment Request"
        message="Are you sure you want to request enrollment for this course?"
        confirmText="Confirm Request"
        isDestructive={false}
        loading={enrollLoading}
        onConfirm={confirmEnroll}
        onCancel={() => {
          if (!enrollLoading) setConfirmEnrollCourseId(null);
        }}
      />
    </div>
  );
}

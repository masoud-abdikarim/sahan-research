"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUserEnrollments, enrollCourse, approveEnrollment } from "@/redux/slice/enrollmentSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import CourseCard from "@/components/CourseCard";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";

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
    <div className="max-w-7xl mx-auto transition-colors duration-500 pb-20">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">My Learning</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            {isAdmin 
              ? "Admin accounts cannot enroll in courses. You are viewing this page in management mode." 
              : "Access all your in-progress courses and resume your research."}
          </p>
        </div>
        {isAdmin && (
          <a href="/dashboard/admin/enrollments" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 transition-all">
            Admin Portal &rarr;
          </a>
        )}
      </div>

      {/* ACTIVE COURSES */}
      <div className="mb-20">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <span className="w-8 h-[2px] bg-indigo-600 dark:bg-indigo-500"></span>
          Active Research
        </h2>
        {enrollLoading ? <Loader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              if (!course) return null;
              return (
                <CourseCard 
                  key={enrollment.id} 
                  course={course} 
                  actionLabel="Continue Learning"
                  onAction={() => window.location.href = `/dashboard/lessons?courseId=${course.id}`} 
                />
              );
            })}
            {activeEnrollments.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-800">
                <p className="text-gray-500 dark:text-slate-500 font-medium">You don't have any active courses at the moment.</p>
                {!isAdmin && (
                  <div className="flex gap-4 justify-center mt-6">
                    <a href="/dashboard/active-courses" className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 hover:bg-indigo-700 transition-all">Enroll in a Course</a>
                    <a href="/dashboard/history" className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">View My History</a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const approvedEnrollments = enrollments.filter(e => e.status === "APPROVED");
  const pendingOrRejected = enrollments.filter(e => e.status !== "APPROVED");
  const unrolledCourses = courses.filter(c => !enrollments.some(e => e.courseId === c.id));

  return (
    <div className="max-w-7xl mx-auto transition-colors duration-500 pb-20">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">My Learning</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Manage your active courses and enrollment requests.</p>
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
          Active Academic Modules
        </h2>
        {enrollLoading ? <Loader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {approvedEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              if (!course) return null;
              return (
                <CourseCard 
                  key={enrollment.id} 
                  course={course} 
                  actionLabel="Continue Learning"
                  onAction={() => window.location.href = `/dashboard/lessons`} 
                />
              );
            })}
            {approvedEnrollments.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-800">
                <p className="text-gray-500 dark:text-slate-500 font-medium">You don't have any active courses yet.</p>
                <a href="/" className="inline-block mt-6 bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 hover:bg-indigo-700 transition-all">Browse Catalog</a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ENROLLMENT REQUESTS */}
        <div>
          <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-indigo-600 dark:bg-indigo-500"></span>
            Enrollment History
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
                <thead className="bg-gray-50 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Course</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Submitted</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {pendingOrRejected.map((enrollment) => {
                    const course = courses.find(c => c.id === enrollment.courseId);
                    return (
                      <tr key={enrollment.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-5 text-sm font-black text-gray-900 dark:text-slate-100">{course?.name || `Course #${enrollment.courseId}`}</td>
                        <td className="px-6 py-5 text-sm font-medium text-gray-500 dark:text-slate-400">
                          {enrollment.createdAt ? (
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-indigo-500 dark:text-indigo-400" />
                              {new Date(enrollment.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-5 text-sm">{getStatusBadge(enrollment.status)}</td>
                      </tr>
                    );
                  })}
                  {pendingOrRejected.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-xs font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest italic">No pending requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AVAILABLE COURSES */}
        <div>
          <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-indigo-600 dark:bg-indigo-500"></span>
            Recommended Research
          </h2>
          <div className="space-y-4">
            {unrolledCourses.slice(0, 3).map(course => (
              <div key={course.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                      {course.name.charAt(0)}
                   </div>
                   <div>
                    <h4 className="font-black text-gray-900 dark:text-slate-100 text-sm">{course.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">${course.price} • {course.durationMonths} Mo</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleEnroll(course.id)}
                  className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
                >
                  Enroll
                </button>
              </div>
            ))}
            {unrolledCourses.length > 3 && (
              <a href="/" className="block text-center text-[10px] font-black text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-[0.2em] pt-4 transition-colors">
                View All Public Courses &rarr;
              </a>
            )}
            {unrolledCourses.length === 0 && (
              <div className="bg-indigo-50/30 dark:bg-indigo-950/10 p-10 rounded-[2rem] border border-dashed border-indigo-100 dark:border-indigo-900/30 text-center">
                 <p className="text-xs font-black text-indigo-400 dark:text-indigo-600 uppercase tracking-widest">You are enrolled in all available courses!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

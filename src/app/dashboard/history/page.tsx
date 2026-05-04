"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import CourseCard from "@/components/CourseCard";
import { CheckCircle2, History, ArrowRight, Calendar } from "lucide-react";

export default function MyHistoryPage() {
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

  const completedEnrollments = enrollments.filter(e => e.status === "APPROVED" && e.isCompleted);

  return (
    <div className="max-w-7xl mx-auto transition-colors duration-500 pb-20">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">My History</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Review courses you have successfully completed</p>
        </div>
      </div>

      <div className="mb-20">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
          <span className="w-8 h-[2px] bg-green-500"></span>
          Completed Research
        </h2>
        
        {enrollLoading || coursesLoading ? <Loader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {completedEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              if (!course) return null;
              
              return (
                <div key={enrollment.id} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 dark:border-green-900/30">
                      Completed
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="pt-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} /> Finished On
                      </span>
                      <span className="text-xs font-black text-gray-900 dark:text-white mt-1">
                        {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : "Verified"}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.location.href = `/dashboard/lessons?courseId=${course.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 text-gray-700 dark:text-slate-200 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-gray-100 dark:border-slate-700 group/btn"
                  >
                    Review Course
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}

            {completedEnrollments.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-gray-200 dark:border-slate-800">
                <History size={48} className="mx-auto text-gray-200 dark:text-slate-800 mb-4" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white">No history yet</h3>
                <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto font-medium mt-2">
                  Complete all lessons in a course to see it listed here in your academic history.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

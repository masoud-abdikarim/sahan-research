"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { getNextLesson, markLessonComplete } from "@/redux/slice/progressSlice";
import Loader from "@/components/Loader";
import { PlayCircle, CheckCircle, BookOpen, Clock, ChevronRight, Layout, BarChart3, Trophy } from "lucide-react";
import toast from "react-hot-toast";

export default function ProgressPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading: enrollLoading } = useSelector((state: RootState) => state.enrollment);
  const { nextLesson, currentStats, loading: progressLoading } = useSelector((state: RootState) => state.progress);
  const { currentUser } = useSelector((state: RootState) => state.user);
  
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | "">("");

  // Only show approved enrollments
  const approvedEnrollments = enrollments.filter(e => e.status === "APPROVED");

  useEffect(() => {
    if (currentUser) {
      dispatch(getUserEnrollments());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    if (selectedEnrollmentId !== "") {
      dispatch(getNextLesson(Number(selectedEnrollmentId)));
    }
  }, [selectedEnrollmentId, dispatch]);

  const handleComplete = async () => {
    if (!nextLesson || selectedEnrollmentId === "") return;
    
    const enrollment = approvedEnrollments.find(e => e.id === Number(selectedEnrollmentId));
    if (!enrollment) return;

    const res = await dispatch(markLessonComplete({
      enrollmentId: Number(selectedEnrollmentId),
      lessonId: nextLesson.id,
      courseId: enrollment.courseId
    }));

    if (markLessonComplete.fulfilled.match(res)) {
      // Refresh both to update global progress bars and local next lesson
      dispatch(getNextLesson(Number(selectedEnrollmentId)));
      dispatch(getUserEnrollments());
    }
  };

  const selectedEnrollment = approvedEnrollments.find(e => e.id === Number(selectedEnrollmentId));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 transition-colors duration-500">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">My Learning Progress</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Track your lessons, complete courses, and master new skills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Course Selection */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <BookOpen size={16} />
            Your Enrolled Courses
          </h2>
          
          <div className="space-y-4">
            {enrollLoading ? (
              <Loader />
            ) : approvedEnrollments.length > 0 ? (
              approvedEnrollments.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedEnrollmentId(e.id)}
                  className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-300 group ${
                    selectedEnrollmentId === e.id 
                      ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-400 shadow-xl shadow-indigo-100 dark:shadow-indigo-950/20 ring-1 ring-indigo-600 dark:ring-indigo-400" 
                      : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-slate-700">
                      {e.course?.imageUrl ? (
                        <img src={e.course.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-200 dark:text-indigo-800 font-black">
                          {e.course?.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-sm truncate ${selectedEnrollmentId === e.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-slate-100"}`}>
                        {e.course?.name}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">
                        {e.completedLessons} / {e.totalLessons} Lessons
                      </p>
                    </div>
                    {e.isCompleted && <Trophy size={18} className="text-amber-500 flex-shrink-0" />}
                  </div>
                  
                  {/* Mini Progress Bar */}
                  <div className="h-1.5 w-full bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${e.isCompleted ? "bg-green-500" : "bg-indigo-600 dark:bg-indigo-400"}`}
                      style={{ width: `${e.progressPercentage}%` }}
                    />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-800">
                <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">No active enrollments found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Progress & Next Lesson */}
        <div className="lg:col-span-2">
          {selectedEnrollmentId === "" ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/20 rounded-3xl flex items-center justify-center text-indigo-400 dark:text-indigo-600 mb-6">
                <Layout size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Select a course to view details</h2>
              <p className="text-gray-500 dark:text-slate-400 max-w-xs font-medium">Click on any course on the left to see your lesson breakdown and continue learning.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Course Header & Stats Card */}
              <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-indigo-100/20 dark:shadow-indigo-950/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{selectedEnrollment?.course?.name}</h2>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={14} /> Course Overview</span>
                    </div>
                  </div>
                  <div className={`px-5 py-2 rounded-2xl font-black text-sm shadow-sm border ${
                    selectedEnrollment?.isCompleted 
                      ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400" 
                      : "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                  }`}>
                    {selectedEnrollment?.isCompleted ? "Completed 🎉" : `${selectedEnrollment?.progressPercentage}% Complete`}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{currentStats?.totalLessons || 0}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-2xl text-center border border-indigo-100/50 dark:border-indigo-900/30">
                    <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-600 uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{currentStats?.completedLessons || 0}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-950 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Left</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{currentStats?.remainingLessons || 0}</p>
                  </div>
                </div>

                {/* Detailed Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 size={16} className="text-indigo-600 dark:text-indigo-400" />
                      Course Mastery
                    </p>
                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{selectedEnrollment?.progressPercentage}%</p>
                  </div>
                  <div className="h-4 w-full bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden p-1 border border-gray-100 dark:border-slate-800 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 shadow-sm ${
                        selectedEnrollment?.isCompleted ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-600"
                      }`}
                      style={{ width: `${selectedEnrollment?.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Up Next / Continue Learning Section */}
              <div className="bg-indigo-600 dark:bg-indigo-900/90 p-8 sm:p-10 rounded-[3rem] shadow-2xl shadow-indigo-200 dark:shadow-black/50 text-white relative overflow-hidden group transition-colors duration-500">
                <div className="relative z-10">
                  <h3 className="text-sm font-black text-indigo-200 dark:text-indigo-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <PlayCircle size={18} />
                    {nextLesson ? "Continue Learning" : "Course Finished"}
                  </h3>
                  
                  {progressLoading ? (
                    <div className="flex justify-center py-4"><Loader /></div>
                  ) : nextLesson ? (
                    <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                      <div className="flex-1">
                        <span className="text-xs font-black text-indigo-200/80 dark:text-indigo-300/80 mb-1 block uppercase tracking-widest">Lesson {nextLesson.order}</span>
                        <h4 className="text-3xl font-black mb-4 leading-tight">{nextLesson.title}</h4>
                        <a 
                          href={nextLesson.videoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-2 bg-white/20 dark:bg-indigo-500/30 backdrop-blur-md text-white border border-white/30 dark:border-indigo-400/30 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/30 dark:hover:bg-indigo-500/50 transition-all uppercase tracking-widest"
                        >
                          Watch Video <ChevronRight size={16} />
                        </a>
                      </div>

                      <button
                        onClick={handleComplete}
                        disabled={progressLoading}
                        className="shrink-0 bg-white dark:bg-indigo-500 text-indigo-600 dark:text-white p-6 rounded-[2rem] hover:bg-indigo-50 dark:hover:bg-indigo-600 transition-all shadow-2xl shadow-black/20 flex flex-col items-center gap-2 group-hover:scale-105 duration-500"
                      >
                        <CheckCircle size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Mark Done</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-20 h-20 bg-white/20 dark:bg-indigo-500/30 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 dark:border-indigo-400/30">
                        <Trophy size={40} />
                      </div>
                      <h3 className="text-2xl font-black mb-2">Congratulations!</h3>
                      <p className="text-indigo-100 dark:text-indigo-200 font-medium">You have mastered every lesson in this course. Excellent work!</p>
                    </div>
                  )}
                </div>
                {/* Decorative blob */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              </div>
            </div>
          )}
        </div>
      </div>
   </div>
  );
}

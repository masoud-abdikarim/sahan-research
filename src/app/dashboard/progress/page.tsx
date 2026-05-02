"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { getNextLesson, markLessonComplete } from "@/redux/slice/progressSlice";
import Loader from "@/components/Loader";
import { PlayCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ProgressPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading: enrollLoading } = useSelector((state: RootState) => state.enrollment);
  const { nextLesson, loading: progressLoading } = useSelector((state: RootState) => state.progress);
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
    
    const res = await dispatch(markLessonComplete({
      enrollmentId: Number(selectedEnrollmentId),
      lessonId: nextLesson.id
    }));

    if (markLessonComplete.fulfilled.match(res)) {
      // Fetch the next lesson immediately
      dispatch(getNextLesson(Number(selectedEnrollmentId)));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Progress</h1>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select a Course Enrollment to View Progress</label>
        <select 
          value={selectedEnrollmentId}
          onChange={(e) => setSelectedEnrollmentId(e.target.value === "" ? "" : Number(e.target.value))}
          className="block w-full sm:w-96 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm"
        >
          <option value="">Select Enrollment...</option>
          {approvedEnrollments.map(e => (
            <option key={e.id} value={e.id}>Enrollment #{e.id} (Course {e.courseId})</option>
          ))}
        </select>
      </div>

      {selectedEnrollmentId !== "" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Up Next</h2>
            
            {progressLoading ? (
              <Loader />
            ) : nextLesson ? (
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="bg-indigo-50 p-4 rounded-xl flex-shrink-0">
                  <PlayCircle size={48} className="text-indigo-600" />
                </div>
                
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1 block">Lesson {nextLesson.order}</span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{nextLesson.title}</h3>
                  <a href={nextLesson.videoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium text-sm">
                    Watch Lesson Video &rarr;
                  </a>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={progressLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-sm font-medium"
                >
                  <CheckCircle size={20} />
                  Mark as Complete
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">You're all caught up!</h3>
                <p className="text-gray-500">You have completed all available lessons for this course.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, FileQuestion, GraduationCap, History, Lock } from "lucide-react";

type Attempt = {
  id: number;
  score: number;
  passed: boolean;
  createdAt: string;
};

type ModuleExam = {
  id: number;
  title: string;
  moduleId: number;
  earnedMarks: number;
  totalMarks: number;
  locked: boolean;
  date: string;
  attempt: Attempt | null;
};

type FinalExam = {
  id: number;
  title: string;
  earnedMarks: number;
  totalMarks: number;
  locked: boolean;
  attemptsCount: number;
  attemptsHistory: Attempt[];
};

type HistoryData = {
  enrollmentId: number;
  courseId: number;
  courseName: string;
  isCompleted: boolean;
  totalEarned: number;
  totalPossible: number;
  certificateEligible: boolean;
  moduleExams: ModuleExam[];
  finalExam: FinalExam | null;
};

export default function ExamHistoryPage() {
  const [data, setData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("/api/user/history");
        setData(res.data.history || []);
      } catch (error: any) {
        toast.error("Failed to load exam history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Exam History</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Review your module marks, final exam attempts, and total course scores.</p>
      </div>

      {data.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 text-center">
          <History className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-xl font-bold">No History Found</h2>
          <p className="text-gray-500 mt-2">You haven't taken any exams yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {data.map((course) => (
            <div key={course.enrollmentId} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {/* Course Header */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 border-b border-indigo-100 dark:border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-indigo-900 dark:text-indigo-100">{course.courseName}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm font-bold">
                    <span className={course.isCompleted ? "text-emerald-600 dark:text-emerald-400 flex items-center gap-1" : "text-amber-600 dark:text-amber-400 flex items-center gap-1"}>
                      {course.isCompleted ? <CheckCircle2 size={16} /> : <FileQuestion size={16} />}
                      {course.isCompleted ? "PASSED" : "IN PROGRESS"}
                    </span>
                    <span className="text-indigo-300 dark:text-indigo-500/50">|</span>
                    <span className={course.certificateEligible ? "text-emerald-600 flex items-center gap-1" : "text-gray-500 flex items-center gap-1"}>
                      <GraduationCap size={16} />
                      {course.certificateEligible ? "Certificate Eligible" : "Certificate Locked"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-400 uppercase tracking-widest font-bold">Total Course Marks</p>
                  <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                    {course.totalEarned}<span className="text-xl text-indigo-300">/{course.totalPossible}</span>
                  </p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Module Exams */}
                <div>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <FileQuestion className="text-gray-400" /> Module Exams
                  </h3>
                  {course.moduleExams.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No module exams taken yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {course.moduleExams.map((mod) => (
                        <div key={mod.id} className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{mod.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {mod.attempt ? new Date(mod.attempt.createdAt).toLocaleDateString() : "No date"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-gray-900 dark:text-white">{mod.earnedMarks}/{mod.totalMarks}</p>
                            <p className="text-xs text-emerald-500 font-bold flex items-center justify-end gap-1 mt-1">
                              <Lock size={12} /> Locked
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final Exam History */}
                <div>
                  <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <History className="text-gray-400" /> Final Exam Attempts
                  </h3>
                  {!course.finalExam ? (
                    <div className="border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 text-center text-gray-500">
                      <p className="font-bold">Not attempted yet</p>
                      <p className="text-xs mt-1">Pass all module exams to unlock the final exam.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-indigo-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-indigo-100 dark:shadow-none">
                        <div>
                          <p className="text-xs text-indigo-200 uppercase font-bold tracking-widest">Best Score</p>
                          <p className="font-black text-xl">{course.finalExam.title}</p>
                        </div>
                        <p className="text-2xl font-black">{course.finalExam.earnedMarks}/{course.finalExam.totalMarks}</p>
                      </div>

                      <div className="space-y-2 mt-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Attempt History</p>
                        {course.finalExam.attemptsHistory.map((attempt, idx) => (
                          <div key={attempt.id} className="border border-gray-100 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">Attempt {course.finalExam!.attemptsHistory.length - idx}</p>
                              <p className="text-xs text-gray-500">{new Date(attempt.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-gray-900 dark:text-white">{attempt.score}/{course.finalExam!.totalMarks}</p>
                              {/* Passed in attempt context means they hit the exam's personal passing threshold, but what matters is course passed */}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

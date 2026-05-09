"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { 
  User, Mail, Phone, Calendar, ArrowLeft, GraduationCap, 
  BookOpen, CheckCircle2, FileQuestion, History, Lock, ChevronDown, Award
} from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = params.id;
  const targetEnrollmentId = searchParams.get("enrollmentId");

  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We default to the enrollment passed in query, or just the first one
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<number | null>(
    targetEnrollmentId ? Number(targetEnrollmentId) : null
  );

  useEffect(() => {
    if (!studentId) return;
    const fetchStudentDetails = async () => {
      try {
        const res = await axios.get(`/api/admin/students/${studentId}`);
        setStudent(res.data.student);
        setEnrollments(res.data.enrollments);
        
        if (res.data.enrollments.length > 0 && !activeEnrollmentId) {
          setActiveEnrollmentId(res.data.enrollments[0].enrollmentId);
        }
      } catch (error: any) {
        toast.error("Failed to fetch student details");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentDetails();
  }, [studentId]);

  if (loading) return <Loader />;
  if (!student) return <div className="p-8 text-center text-gray-500">Student not found</div>;

  const activeEnrollment = enrollments.find(e => e.enrollmentId === activeEnrollmentId) || enrollments[0];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "GRADUATED": return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">GRADUATED</span>;
      case "CERTIFIED": return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">CERTIFIED</span>;
      case "FAILED": return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30">FAILED</span>;
      case "PRESENT": return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">PRESENT (STUDYING)</span>;
      default: return <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400">{status}</span>;
    }
  };

  const getCertBadge = (status: string) => {
    if (status === "ISSUED" || status === "APPROVED") return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold flex items-center gap-1"><Award size={14}/> ISSUED</span>;
    if (status === "PENDING") return <span className="px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl font-bold flex items-center gap-1"><Award size={14}/> PENDING</span>;
    if (status === "ELIGIBLE") return <span className="px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold flex items-center gap-1"><Award size={14}/> ELIGIBLE</span>;
    return <span className="px-3 py-1 bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-xl font-bold flex items-center gap-1"><Award size={14}/> {status.toUpperCase()}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button 
        onClick={() => router.push("/dashboard/admin/students")}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to Manage Students
      </button>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="w-32 h-32 rounded-3xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden z-10">
          {student.avatar ? <img src={student.avatar} alt="avatar" className="w-full h-full object-cover"/> : <User size={48}/>}
        </div>
        
        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{student.name}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><Mail size={16} /> {student.email}</span>
            <span className="flex items-center gap-1.5"><Phone size={16} /> {student.phone || "No phone"}</span>
            <span className="flex items-center gap-1.5"><Calendar size={16} /> Joined {new Date(student.joinedAt).getFullYear()}</span>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <BookOpen className="mx-auto text-gray-300 dark:text-slate-700 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Enrollments</h2>
          <p className="text-gray-500 mt-2">This student has not enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Course Selector Tabs */}
          {enrollments.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {enrollments.map(enr => (
                <button
                  key={enr.enrollmentId}
                  onClick={() => setActiveEnrollmentId(enr.enrollmentId)}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                    activeEnrollmentId === enr.enrollmentId 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                      : "bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-indigo-300"
                  }`}
                >
                  {enr.courseName}
                </button>
              ))}
            </div>
          )}

          {activeEnrollment && (
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {/* Course Header Banner */}
              <div className="bg-gray-50 dark:bg-slate-800/50 p-6 md:p-8 border-b border-gray-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <BookOpen size={20} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{activeEnrollment.courseName}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(activeEnrollment.graduationStatus)}
                    {getCertBadge(activeEnrollment.certificateStatus)}
                    {activeEnrollment.graduationDate && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700">
                        <Calendar size={14} /> Graduated: {new Date(activeEnrollment.graduationDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm text-center min-w-[150px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Course Score</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{activeEnrollment.totalMarks}</p>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Col: Module Progress */}
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" /> Module Marks Timeline
                  </h3>
                  
                  {activeEnrollment.moduleExams.length === 0 ? (
                    <div className="border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 text-center text-gray-500 bg-gray-50/50 dark:bg-slate-800/20">
                      <p className="font-bold text-sm">No module exams taken yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-indigo-50 before:to-transparent dark:before:from-indigo-900/50 dark:before:via-indigo-900/20">
                      {activeEnrollment.moduleExams.map((mod: any, i: number) => (
                        <div key={mod.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          {/* Timeline dot */}
                          <div className="flex items-center justify-center w-9 h-9 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                            <CheckCircle2 size={16} />
                          </div>
                          
                          {/* Card */}
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white">{mod.title}</p>
                                <p className="text-[10px] text-gray-500">{new Date(mod.date).toLocaleDateString()}</p>
                              </div>
                              <p className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg text-sm">{mod.earnedMarks}/{mod.totalMarks}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 inline-flex px-2 py-1 rounded-md uppercase tracking-wider">
                              <Lock size={10}/> Locked (Attempt 1/1)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Col: Final Exam & Stats */}
                <div className="space-y-6">
                  {/* Final Exam Box */}
                  <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2 relative z-10">
                      <History className="text-indigo-400" /> Final Exam History
                    </h3>
                    
                    {!activeEnrollment.finalExam ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-gray-400 relative z-10">
                        <p className="font-bold text-sm">Not attempted yet</p>
                        <p className="text-xs mt-1 opacity-70">Student must complete all modules first.</p>
                      </div>
                    ) : (
                      <div className="relative z-10">
                        <div className="flex items-center justify-between bg-indigo-600 p-4 rounded-2xl mb-4">
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 mb-1">Best Recorded Score</p>
                            <p className="font-bold text-sm">{activeEnrollment.finalExam.title}</p>
                          </div>
                          <p className="text-2xl font-black">{activeEnrollment.finalExam.earnedMarks}/{activeEnrollment.finalExam.totalMarks}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-2">Attempt Log ({activeEnrollment.finalExam.attemptsCount})</p>
                          {activeEnrollment.finalExam.attemptsHistory.map((attempt: any, idx: number) => (
                            <div key={attempt.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl">
                              <div>
                                <p className="text-xs font-bold text-gray-300">Attempt {activeEnrollment.finalExam.attemptsHistory.length - idx}</p>
                                <p className="text-[10px] text-gray-500">{new Date(attempt.createdAt).toLocaleString()}</p>
                              </div>
                              <p className="text-sm font-black text-indigo-300">{attempt.score}/{activeEnrollment.finalExam.totalMarks}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-800/20">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Modules Progress</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{activeEnrollment.completedModules} / {activeEnrollment.modulesCount}</p>
                    </div>
                    <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-slate-800/20">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Lessons Complete</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{activeEnrollment.lessonsCompletedCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

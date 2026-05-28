"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { enrollCourse, getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Clock, 
  ChevronDown, 
  PlayCircle, 
  CheckCircle2, 
  Users, 
  Layers, 
  FileText,
  ArrowLeft,
  Calendar,
  Layout,
  Star,
  ShieldCheck,
  Zap,
  GraduationCap,
  Lock,
  ArrowRight,
  Info,
  Check,
  Target
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";

interface Lesson {
  id: number;
  title: string;
  order: number;
}

interface Module {
  id: number;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  name: string;
  description: string;
  outcomes: string[];
  whoIsFor: string[];
  prerequisites: string[];
  instructor: string | null;
  price: number;
  durationMonths: number;
  category: string;
  imageUrl: string | null;
  lastUpdated: string;
  modules: Module[];
}

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  
  const [confirmEnrollCourseId, setConfirmEnrollCourseId] = useState<number | null>(null);

  const { currentUser } = useSelector((state: RootState) => state.user);
  const { enrollments, loading: enrollLoading } = useSelector((state: RootState) => state.enrollment);

  useEffect(() => {
    if (currentUser) {
      dispatch(getUserEnrollments());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        const res = await axios.get(`/api/public/courses/${id}`);
        setCourse(res.data.course);
        if (res.data.course.modules?.length > 0) {
          setExpandedModules([res.data.course.modules[0].id]);
        }
      } catch (error) {
        console.error("Failed to fetch course details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleEnrollClick = () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if ((currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN")) {
      toast.error("Admins do not need to request courses.");
      return;
    }
    setConfirmEnrollCourseId(Number(id));
  };

  const confirmEnroll = async () => {
    if (confirmEnrollCourseId !== null && currentUser) {
      await dispatch(enrollCourse(confirmEnrollCourseId));
      setConfirmEnrollCourseId(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950"><Loader /></div>;

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Course Not Found</h1>
        <Link href="/" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all">Return Home</Link>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);

  const existingEnrollment = currentUser ? enrollments.find(e => e.courseId === Number(id)) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 font-sans">
      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-white transition-colors mb-10 font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft size={14} /> Back to Curriculum
          </Link>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/50">
                {course.category}
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={14} className="fill-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">4.9 (1.2k Ratings)</span>
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tighter leading-[1.05]">
              {course.name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-indigo-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-0.5">Duration</p>
                    <p className="font-black text-white text-sm uppercase tracking-wide">{course.durationMonths} Months</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-emerald-400">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-0.5">Investment</p>
                    <p className="font-black text-white text-sm uppercase tracking-wide">${course.price.toFixed(2)}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-amber-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-300/50 uppercase tracking-widest mb-0.5">Instructor</p>
                    <p className="font-black text-white text-sm uppercase tracking-wide">{course.instructor || "Sahan Studies"}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* LEFT COLUMN: Course Info */}
            <div className="lg:col-span-8 space-y-20">
              
              {/* DESCRIPTION SECTION: PREMIUM CONTAINER */}
              <div className="bg-indigo-50 dark:bg-slate-900/50 p-10 sm:p-14 rounded-[3rem] border border-indigo-100 dark:border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <FileText size={20} />
                  </div>
                  Course Overview
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-[1.8] font-medium whitespace-pre-line">
                  {course.description}
                </p>
              </div>

              {/* REQUIREMENTS SECTION */}
              {course.prerequisites?.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Info size={20} />
                    </div>
                    Program Requirements
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.prerequisites.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/30 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                          <Check size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OUTCOMES SECTION: BULLET LIST WITH ICONS */}
              {course.outcomes?.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <GraduationCap size={20} />
                    </div>
                    What You Will Learn
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {course.outcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-start gap-4 group">
                        <div className="w-6 h-6 mt-1 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={12} />
                        </div>
                        <p className="text-base font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WHO IS THIS FOR SECTION */}
              {course.whoIsFor?.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <Target size={20} />
                    </div>
                    Who This Course Is For
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {course.whoIsFor.map((item, idx) => (
                      <div key={idx} className="px-6 py-3 bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-400 rounded-2xl border border-violet-100 dark:border-violet-900/20 font-black text-[10px] uppercase tracking-widest">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CURRICULUM SECTION */}
              <div className="space-y-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Layout size={20} />
                  </div>
                  Curriculum Structure
                </h2>
                <div className="space-y-4">
                  {course.modules.map((module, idx) => (
                    <div key={module.id} className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-none">
                      <button onClick={() => toggleModule(module.id)} className={`w-full flex items-center justify-between p-8 text-left transition-all ${expandedModules.includes(module.id) ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                        <div className="flex items-center gap-6">
                          <span className={`text-xs font-black uppercase tracking-[0.2em] ${expandedModules.includes(module.id) ? 'text-indigo-600' : 'text-slate-400'}`}>Section {idx + 1}</span>
                          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">{module.title}</h3>
                        </div>
                        <ChevronDown size={20} className={`transition-transform duration-500 ${expandedModules.includes(module.id) ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                      </button>
                      <AnimatePresence>
                        {expandedModules.includes(module.id) && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-50 dark:border-slate-800/50">
                            <div className="p-4 space-y-2">
                              {module.lessons.map((lesson, lIdx) => (
                                <div key={lesson.id} className="flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                                  <div className="flex items-center gap-4">
                                    <PlayCircle size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Lesson {idx+1}.{lIdx+1}: {lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                     <span className="group-hover:text-indigo-600">Locked</span>
                                     <Lock size={14} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY SIDEBAR */}
            <div className="lg:col-span-4">
              <div className="sticky top-32 space-y-8">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden transition-all hover:shadow-indigo-100 dark:hover:shadow-none p-4">
                  <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-8">
                     {course.imageUrl ? (
                       <img src={course.imageUrl} className="w-full h-full object-cover" alt={course.name} />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-indigo-600"><BookOpen size={48} className="text-white/20" /></div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  <div className="px-6 pb-6 space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">${course.price}</span>
                          {course.price > 0 && <span className="text-sm font-bold text-slate-400 line-through">${course.price * 2}</span>}
                        </div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1">Full Life-Time Access</p>
                      </div>
                    </div>

                    {existingEnrollment ? (
                      <div className="flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black py-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs uppercase tracking-widest cursor-default">
                        <CheckCircle2 size={18} className={existingEnrollment.status === "PENDING" ? "text-amber-500" : existingEnrollment.status === "REJECTED" ? "text-red-500" : "text-emerald-500"} />
                        {existingEnrollment.status === "PENDING" ? "Pending Request" : existingEnrollment.status === "REJECTED" ? "Enrollment Rejected" : "Already Enrolled"}
                      </div>
                    ) : (
                      <button onClick={handleEnrollClick} className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest group">
                        {currentUser ? "Request Enrollment" : "Login To Enroll"}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}

                    <div className="space-y-4 pt-8 border-t border-slate-50 dark:border-slate-800/50">
                       {[
                         { icon: Layers, label: "Modules", val: `${course.modules.length} Sections` },
                         { icon: PlayCircle, label: "Lessons", val: `${totalLessons} Lectures` },
                         { icon: Clock, label: "Duration", val: `${course.durationMonths} Months` },
                         { icon: ShieldCheck, label: "Status", val: "Academic Certified" }
                       ].map((s, i) => (
                         <div key={i} className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                             <s.icon size={14} className="text-indigo-500" /> {s.label}
                           </span>
                           <span className="text-xs font-black text-slate-700 dark:text-slate-300">{s.val}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800">
                      <GraduationCap size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                     Official Academic <br/> 
                     <span className="text-indigo-600 dark:text-indigo-400 font-black">Certificate Included</span>
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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


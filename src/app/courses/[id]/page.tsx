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
  Target,
  X
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
  level: string;
  totalHours: number | null;
  previewVideoType: "UPLOAD" | "URL" | null;
  previewVideoUrl: string | null;
}

function getYoutubeId(url: string): string | null {
  const m = url.trim().match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.trim().match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [playPreviewVideo, setPlayPreviewVideo] = useState(false);
  
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
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 font-sans pb-28 lg:pb-12">
      {/* ── HEADER SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-12 overflow-hidden bg-slate-950 border-b border-slate-900">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-white transition-colors mb-6 font-black uppercase tracking-widest text-[10px]">
            <ArrowLeft size={14} /> Back to Curriculum
          </Link>

          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/50">
                {course.category}
              </span>
              <div className="flex items-center gap-1 text-amber-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <Star size={12} className="fill-amber-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">4.9 (1.2k Ratings)</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Last Updated: {new Date(course.lastUpdated).toLocaleDateString("en-US", { month: "short", year: "numeric", day: "numeric" })}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              {course.name}
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-3 max-w-3xl line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <section className="py-12 bg-gray-50/50 dark:bg-slate-950 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT / CENTER COLUMN: Video Player & Details */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* Preview Video player */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-3 relative group">
                <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-black flex items-center justify-center">
                  {!playPreviewVideo ? (
                    // Thumbnail before play
                    <>
                      {course.imageUrl ? (
                        <img 
                          src={course.imageUrl} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          alt="Course Promo Banner" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-slate-900 flex items-center justify-center">
                          <BookOpen size={64} className="text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all group-hover:bg-black/55">
                        {course.previewVideoUrl ? (
                          <>
                            <button
                              onClick={() => setPlayPreviewVideo(true)}
                              className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl scale-95 group-hover:scale-105 transition-all duration-300 hover:bg-indigo-700 cursor-pointer"
                              aria-label="Play Promo Video"
                            >
                              <PlayCircle size={40} className="ml-1 fill-white/10" />
                            </button>
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] mt-4 bg-indigo-600/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                              Watch Preview Video
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            Course Banner Preview
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    // Render actual player
                    course.previewVideoUrl && (
                      <div className="w-full h-full relative">
                        {course.previewVideoType === "URL" ? (
                          (() => {
                            const ytId = getYoutubeId(course.previewVideoUrl);
                            if (ytId) {
                              return (
                                <iframe
                                  className="w-full h-full"
                                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
                                  title="Course Promo Video"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            }
                            const vimeoId = getVimeoId(course.previewVideoUrl);
                            if (vimeoId) {
                              return (
                                <iframe
                                  className="w-full h-full"
                                  src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                                  title="Course Promo Video"
                                  frameBorder="0"
                                  allow="autoplay; fullscreen; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            }
                            return (
                              <video 
                                autoPlay 
                                controls 
                                controlsList="nodownload" 
                                className="w-full h-full"
                              >
                                <source src={course.previewVideoUrl} type="video/mp4" />
                              </video>
                            );
                          })()
                        ) : (
                          <video 
                            autoPlay 
                            controls 
                            controlsList="nodownload" 
                            className="w-full h-full"
                          >
                            <source src={course.previewVideoUrl} type="video/mp4" />
                          </video>
                        )}
                        <button
                          onClick={() => setPlayPreviewVideo(false)}
                          className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors border border-white/10 backdrop-blur-sm cursor-pointer"
                          title="Close Video"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Center Content Section */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 sm:p-12 space-y-12 shadow-sm">
                
                {/* 1. ABOUT THIS COURSE */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <FileText size={16} /> About This Course
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line text-base">
                    {course.description}
                  </p>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* 2. WHAT YOU WILL LEARN */}
                {course.outcomes?.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <GraduationCap size={16} /> What You Will Learn
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.outcomes.map((outcome, idx) => (
                        <div key={idx} className="flex items-start gap-3 group">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-emerald-200 dark:shadow-none">
                            <Check size={12} className="stroke-[3]" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. PREREQUISITES */}
                {course.prerequisites?.length > 0 && (
                  <>
                    <hr className="border-slate-100 dark:border-slate-800" />
                    <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <Info size={16} /> Course Prerequisites
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.prerequisites.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Check size={10} className="stroke-[3]" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 4. TARGET AUDIENCE */}
                {course.whoIsFor?.length > 0 && (
                  <>
                    <hr className="border-slate-100 dark:border-slate-800" />
                    <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 flex items-center gap-2">
                        <Target size={16} /> Target Audience
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {course.whoIsFor.map((item, idx) => (
                          <span key={idx} className="px-4 py-2 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/30 rounded-xl text-xs font-bold uppercase tracking-wider">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 5. INSTRUCTOR INFORMATION */}
                <hr className="border-slate-100 dark:border-slate-800" />
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Users size={16} /> Instructor Details
                  </h3>
                  <div className="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
                      {course.instructor ? course.instructor.charAt(0) : "S"}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">{course.instructor || "Sahan Studies"}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Academic Researcher & Educator</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* CURRICULUM SECTION */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 pl-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Layout size={16} />
                  </div>
                  Curriculum Structure
                </h3>
                <div className="space-y-4">
                  {course.modules.map((module, idx) => (
                    <div key={module.id} className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md">
                      <button onClick={() => toggleModule(module.id)} className={`w-full flex items-center justify-between p-6 sm:p-8 text-left transition-all ${expandedModules.includes(module.id) ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}>
                        <div className="flex items-center gap-4 sm:gap-6">
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${expandedModules.includes(module.id) ? 'text-indigo-600' : 'text-slate-400'}`}>Section {idx + 1}</span>
                          <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">{module.title}</h3>
                        </div>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${expandedModules.includes(module.id) ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                      </button>
                      <AnimatePresence>
                        {expandedModules.includes(module.id) && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-50 dark:border-slate-800/50">
                            <div className="p-4 space-y-1">
                              {module.lessons.map((lesson, lIdx) => (
                                <div key={lesson.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group">
                                  <div className="flex items-center gap-3">
                                    <PlayCircle size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Lesson {idx+1}.{lIdx+1}: {lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                     <span className="group-hover:text-indigo-600">Locked</span>
                                     <Lock size={12} />
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
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-32 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-8">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">Tuition Fee</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">${course.price}</span>
                      {course.price > 0 && <span className="text-sm font-bold text-slate-400 line-through">${course.price * 2}</span>}
                    </div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-2">Full Life-Time Access</p>
                  </div>

                  {existingEnrollment ? (
                    <div className="flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-black py-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs uppercase tracking-widest cursor-default">
                      <CheckCircle2 size={16} className={existingEnrollment.status === "PENDING" ? "text-amber-500" : existingEnrollment.status === "REJECTED" ? "text-red-500" : "text-emerald-500"} />
                      {existingEnrollment.status === "PENDING" ? "Pending Request" : existingEnrollment.status === "REJECTED" ? "Enrollment Rejected" : "Already Enrolled"}
                    </div>
                  ) : (
                    <button onClick={handleEnrollClick} className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest group cursor-pointer">
                      {currentUser ? "Request Enrollment" : "Login To Enroll"}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                     {[
                       { icon: Clock, label: "Duration", val: `${course.durationMonths} Months` },
                       { icon: Zap, label: "Course Level", val: course.level || "All Levels" },
                       { icon: BookOpen, label: "Total Hours", val: course.totalHours ? `${course.totalHours} Hours` : "0 Hours" },
                       { icon: Layers, label: "Category", val: course.category },
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

                  <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-800">
                        <GraduationCap size={20} />
                     </div>
                     <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                       Official Academic <br/> 
                       <span className="text-indigo-600 dark:text-indigo-400 font-black">Certificate Included</span>
                     </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MOBILE STICKY ENROLL AREA (Only visible on screens < lg) ────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 p-4 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tuition Fee</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">${course.price}</span>
            {course.price > 0 && <span className="text-xs font-bold text-slate-400 line-through">${course.price * 2}</span>}
          </div>
        </div>

        <div className="flex-1 max-w-xs">
          {existingEnrollment ? (
            <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-black py-4 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-widest cursor-default text-center">
              {existingEnrollment.status === "PENDING" ? "Pending" : existingEnrollment.status === "REJECTED" ? "Rejected" : "Enrolled"}
            </div>
          ) : (
            <button onClick={handleEnrollClick} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest cursor-pointer">
              {currentUser ? "Request Enroll" : "Login"}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

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


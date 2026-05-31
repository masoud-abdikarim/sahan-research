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
  Clock, 
  ChevronDown, 
  PlayCircle, 
  CheckCircle2, 
  Users, 
  GraduationCap,
  Lock,
  ArrowRight,
  Check,
  ThumbsUp,
  ThumbsDown,
  Award
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader /></div>;

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Course Not Found</h1>
        <Link href="/" className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition-all">Return Home</Link>
      </div>
    );
  }

  const existingEnrollment = currentUser ? enrollments.find(e => e.courseId === Number(id)) : null;

  // Custom Button Component for reuse
  const EnrollButton = ({ outlined = false }: { outlined?: boolean }) => {
    if (existingEnrollment) {
      return (
        <button 
          disabled
          className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            outlined 
              ? "border-2 border-emerald-600 text-emerald-600 bg-white" 
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {existingEnrollment.status === "PENDING" ? "Pending Request" : 
           existingEnrollment.status === "REJECTED" ? "Request Rejected" : 
           "Already Enrolled"}
        </button>
      );
    }
    return (
      <button 
        onClick={handleEnrollClick}
        className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
          outlined 
            ? "border-2 border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50" 
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {outlined ? (
          <>
            <Award size={18} /> Certify Now
          </>
        ) : (
          "Enroll Now"
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20 pt-20 sm:pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN (STICKY COURSE CARD) */}
          <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 lg:sticky lg:top-28">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Video/Image Area */}
              <div className="relative aspect-video bg-slate-100 group">
                {course.previewVideoUrl ? (
                  <div className="w-full h-full relative bg-black">
                    {course.previewVideoType === "URL" ? (
                      (() => {
                        const ytId = getYoutubeId(course.previewVideoUrl);
                        if (ytId) {
                          return (
                            <iframe
                              className="w-full h-full"
                              src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
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
                              src={`https://player.vimeo.com/video/${vimeoId}`}
                              title="Course Promo Video"
                              frameBorder="0"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        }
                        return (
                          <video controls controlsList="nodownload" className="w-full h-full">
                            <source src={course.previewVideoUrl} type="video/mp4" />
                          </video>
                        );
                      })()
                    ) : (
                      <video controls controlsList="nodownload" className="w-full h-full">
                        <source src={course.previewVideoUrl} type="video/mp4" />
                      </video>
                    )}
                    {/* Tags overlay */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none">
                       <span className="bg-[#b4d429] text-[10px] font-bold px-2 py-0.5 shadow-sm text-slate-900 uppercase pointer-events-auto">{course.category}</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative group">
                    {course.imageUrl ? (
                      <img 
                        src={course.imageUrl} 
                        className="w-full h-full object-cover" 
                        alt={course.name} 
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                        No Preview Available
                      </div>
                    )}
                    {/* Tags overlay */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                       <span className="bg-[#b4d429] text-[10px] font-bold px-2 py-0.5 shadow-sm text-slate-900 uppercase">{course.category}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">${course.price}</span>
                </div>
                
                <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-3">
                  {course.name}
                </h2>
                
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <GraduationCap size={16} className="text-[#00825a]" />
                    <span><strong className="text-slate-900 font-bold">100+</strong> Learners enrolled</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-5">
                   <div className="flex items-center gap-1">
                      <ThumbsUp size={14} /> 103
                   </div>
                   <span className="text-slate-400">Interested</span>
                </div>

                <hr className="border-slate-200 mb-5" />

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-[#f1f0f9] flex items-center justify-center text-[#6b58ba]">
                       <Clock size={14} />
                    </div>
                    {course.durationMonths} Months Duration
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-[#e6f4f6] flex items-center justify-center text-[#009fb2]">
                       <Award size={14} />
                    </div>
                    CPD Accredited
                  </div>
                </div>

                <div className="space-y-3">
                   <EnrollButton />
                   <EnrollButton outlined={true} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (MAIN CONTENT) */}
          <div className="w-full lg:flex-1">
            
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center text-[13px] text-slate-500 gap-2 mb-3 font-medium">
              <Link href="/" className="hover:text-[#00825a]">Home</Link>
              <span>›</span>
              <span className="text-[#00825a]">{course.name}</span>
            </div>

            {/* Title & Description */}
            <h1 className="text-[32px] sm:text-[40px] font-bold text-slate-900 leading-tight mb-4 tracking-tight">
              {course.name}
            </h1>
            <p className="text-[15px] text-slate-600 mb-6 leading-relaxed">
              {course.description}
            </p>

            <hr className="border-slate-200 my-8" />

            {/* Publisher & Actions Desktop Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
               <div className="flex items-start gap-4">
                  <div className="w-[50px] h-[50px] rounded flex-shrink-0 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-bold shadow-sm relative overflow-hidden">
                     {course.instructor ? course.instructor.charAt(0).toUpperCase() : "S"}
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rotate-45"></div>
                     <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-400 rotate-45"></div>
                  </div>
                  <div>
                     <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Instructor</p>
                     <p className="text-[15px] font-bold text-slate-800 cursor-pointer">
                       {course.instructor || "Sahan Studies"}
                     </p>
                  </div>
               </div>
               
               <div className="flex gap-3 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-initial sm:w-[160px]">
                     <EnrollButton />
                  </div>
                  <div className="flex-1 sm:flex-initial sm:w-[160px]">
                     <EnrollButton outlined={true} />
                  </div>
               </div>
            </div>

            {/* What You Will Learn (Cyan Box) */}
            {course.outcomes?.length > 0 && (
              <div className="bg-[#eef8fa] rounded-xl p-6 sm:p-8 mb-10 border border-[#d2edf1]">
                 <h3 className="text-xl font-bold text-slate-900 mb-6">What You Will Learn In This Free Course</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {course.outcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#009fb2] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 leading-snug">{outcome}</span>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Curriculum Section */}
            <div className="mb-10">
              <h3 className="text-[22px] font-bold text-slate-900 mb-6">Syllabus</h3>
              <div className="space-y-3">
                {course.modules.map((module, idx) => (
                  <div key={module.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <button 
                      onClick={() => toggleModule(module.id)} 
                      className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <h4 className="text-[16px] font-bold text-slate-800">{module.title}</h4>
                      </div>
                      <ChevronDown size={20} className={`transition-transform duration-300 text-slate-400 ${expandedModules.includes(module.id) ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {expandedModules.includes(module.id) && (
                        <motion.div 
                          initial={{ height: 0 }} 
                          animate={{ height: "auto" }} 
                          exit={{ height: 0 }} 
                          className="border-t border-slate-100"
                        >
                          <div className="py-2 px-5">
                            {module.lessons.map((lesson, lIdx) => (
                              <div key={lesson.id} className="flex items-center justify-between py-3 border-b last:border-0 border-slate-100 group">
                                <div className="flex items-center gap-3">
                                  <PlayCircle size={18} className="text-slate-300 group-hover:text-[#00825a] transition-colors" />
                                  <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                    {lesson.title}
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  Locked <Lock size={12} />
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

            {/* Prerequisites & Target Audience */}
            {(course.prerequisites?.length > 0 || course.whoIsFor?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {course.prerequisites?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Prerequisites</h3>
                    <ul className="space-y-3">
                      {course.prerequisites.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[14px] text-slate-600 font-medium">
                          <Check size={16} className="text-[#00825a] shrink-0 mt-0.5" /> {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.whoIsFor?.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Who Is This For?</h3>
                    <ul className="space-y-3">
                      {course.whoIsFor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[14px] text-slate-600 font-medium">
                          <Check size={16} className="text-[#009fb2] shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>
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


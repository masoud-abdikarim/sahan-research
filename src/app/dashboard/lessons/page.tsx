"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getLessonsByCourse, createLesson, updateLesson, deleteLesson, Lesson } from "@/redux/slice/lessonSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { markLessonComplete } from "@/redux/slice/progressSlice";
import Loader from "@/components/Loader";
import { Plus, Video, PlayCircle, Upload, Link as LinkIcon, FileVideo, HardDrive, Lock, CheckCircle2, Edit, Trash2, X, Star, Layers, BarChart3, BookOpen, GraduationCap, ChevronRight, ArrowRight, Clock } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { UploadButton, UploadDropzone } from "@/lib/uploadthing";
import ConfirmModal from "@/components/ConfirmModal";

export default function LessonsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { lessons, loading: lessonsLoading } = useSelector((state: RootState) => state.lesson);
  const { courses } = useSelector((state: RootState) => state.course);
  const { enrollments } = useSelector((state: RootState) => state.enrollment);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedModuleId, setSelectedModuleId] = useState<number | "">("");
  const [modules, setModules] = useState<any[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [videoSource, setVideoSource] = useState<"UPLOAD" | "URL">("URL");
  const [activeLesson, setActiveLesson] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    order: "",
  });

  // Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (isAdmin) {
      dispatch(getCourses());
    } else {
      dispatch(getUserEnrollments());
    }
  }, [dispatch, isAdmin]);

  const availableCourses = isAdmin 
    ? courses 
    : enrollments
        .filter(e => e.status === "APPROVED")
        .map(e => ({ id: e.courseId, name: e.course?.name || "Unknown Course" }));

  // Handle course selection
  useEffect(() => {
    if (selectedCourseId === "" || selectedCourseId === 0) {
      dispatch(getLessonsByCourse(0)); // All lessons
      setModules([]);
      setSelectedModuleId("");
      return;
    }

    dispatch(getLessonsByCourse(Number(selectedCourseId)));

    const fetchModules = async () => {
      setModulesLoading(true);
      try {
        const res = await axios.get(`/api/admin/modules?courseId=${selectedCourseId}`);
        setModules(res.data.modules);
      } catch (error) {
        console.error("Failed to fetch modules:", error);
      } finally {
        setModulesLoading(false);
      }
    };
    fetchModules();
  }, [selectedCourseId, dispatch]);

  const filteredLessons = lessons.filter(lesson => {
    if (selectedModuleId && selectedModuleId !== "") {
      return lesson.moduleId === Number(selectedModuleId);
    }
    return true;
  });

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !selectedCourseId) return;

    setIsCreatingModule(true);
    try {
      const res = await axios.post("/api/admin/modules", {
        title: newModuleTitle.trim(),
        courseId: Number(selectedCourseId),
        order: modules.length + 1
      });
      setModules([...modules, res.data.module]);
      setSelectedModuleId(res.data.module.id);
      setShowModuleModal(false);
      setNewModuleTitle("");
      toast.success("Module created successfully!");
    } catch (error) {
      toast.error("Failed to create module");
    } finally {
      setIsCreatingModule(false);
    }
  };

  const handleEditInit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedCourseId(lesson.courseId);
    setSelectedModuleId(lesson.moduleId);
    setFormData({
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      order: lesson.order.toString(),
    });
    setVideoSource(lesson.videoType);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLesson(null);
    setSelectedModuleId("");
    setFormData({ title: "", videoUrl: "", order: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.order || !selectedCourseId || !selectedModuleId || !formData.videoUrl) {
      toast.error("Please fill in all required fields, including Course and Module.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      order: parseInt(formData.order, 10),
      courseId: Number(selectedCourseId),
      moduleId: Number(selectedModuleId),
      videoType: videoSource,
      videoUrl: formData.videoUrl
    };

    if (editingLesson) {
      const res = await dispatch(updateLesson({ id: editingLesson.id, data: payload }));
      if (updateLesson.fulfilled.match(res)) handleCancel();
    } else {
      const res = await dispatch(createLesson(payload));
      if (createLesson.fulfilled.match(res)) handleCancel();
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteId) {
      await dispatch(deleteLesson(confirmDeleteId));
      if (activeLesson?.id === confirmDeleteId) setActiveLesson(null);
      setConfirmDeleteId(null);
    }
  };

  const currentEnrollment = selectedCourseId !== "" 
    ? enrollments.find(e => e.courseId === Number(selectedCourseId))
    : null;

  const isCourseCompleted = currentEnrollment?.isCompleted || false;

  const handleLessonComplete = async (lessonId: number) => {
    if (isAdmin || isCourseCompleted) return;
    
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const enrollment = enrollments.find(e => e.courseId === lesson.courseId && e.status === "APPROVED");
    if (!enrollment) {
      toast.error("Active enrollment not found");
      return;
    }

    const res = await dispatch(markLessonComplete({ 
      courseId: lesson.courseId, 
      lessonId,
      enrollmentId: enrollment.id
    }));

    if (markLessonComplete.fulfilled.match(res)) {
      const cid = selectedCourseId === "" ? 0 : Number(selectedCourseId);
      const refreshRes = await dispatch(getLessonsByCourse(cid));
      
      if (getLessonsByCourse.fulfilled.match(refreshRes)) {
        // If the backend says the course is now completed, show a success toast
        const updatedLessons = refreshRes.payload;
        const allCompleted = updatedLessons.every((l: any) => l.completed);
        if (allCompleted) {
          toast.success("Congratulations! You have completed the course.", { icon: '🎓', duration: 5000 });
        } else {
          toast.success("Lesson completed!");
        }
      }
    }
  };

  const renderPlayer = (lesson: any) => {
    const handleEnded = () => handleLessonComplete(lesson.id);

    // Watch progress threshold (95%)
    const handleTimeUpdate = (e: any) => {
      const video = e.target;
      const progress = (video.currentTime / video.duration) * 100;
      if (progress >= 95 && !lesson.completed && !isAdmin) {
        // We could auto-complete here, but onEnded is safer for "fully watched"
      }
    };

    if (lesson.videoType === "URL") {
      const ytMatch = lesson.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/||.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch) {
        return (
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1&rel=0&modestbranding=1`}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            {!isAdmin && !lesson.completed && (
              <div className="absolute bottom-4 right-4 animate-pulse">
                <button 
                  onClick={handleEnded}
                  className="bg-green-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-green-500 transition-all flex items-center gap-2 border border-green-400/30"
                >
                  <CheckCircle2 size={16} /> I have watched fully
                </button>
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
          <video 
            controls 
            className="w-full h-full" 
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            controlsList="nodownload"
          >
            <source src={lesson.videoUrl} type="video/mp4" />
          </video>
        </div>
      );
    } else {
      return (
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video 
            controls 
            controlsList="nodownload" 
            className="w-full h-full" 
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
          >
            <source src={lesson.videoUrl} type="video/mp4" />
          </video>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 transition-colors duration-500 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6 pt-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                 <GraduationCap size={16} />
              </div>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Institutional Learning</span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">Academic Research Center</h1>
           <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium text-lg">Master your curriculum with guided lectures and expert-led modules.</p>
        </div>
        
        {isAdmin && (
           <button
             onClick={() => (showForm ? handleCancel() : setShowForm(true))}
             className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl transition-all shadow-xl font-black text-xs uppercase tracking-widest ${
               showForm 
                 ? "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700" 
                 : "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-indigo-100 dark:shadow-none hover:-translate-y-1"
             }`}
           >
             {showForm ? <X size={18} /> : <><Plus size={18} /> Publish Lesson</>}
           </button>
        )}
      </div>

      {/* ── PROGRESS & STATS ── */}
      {!isAdmin && selectedCourseId !== "" && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 p-10 shadow-2xl shadow-indigo-500/5 dark:shadow-none relative overflow-hidden">
            {/* Decorative background logo */}
            <img src="/logo.jpeg" alt="" className="absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.03] dark:opacity-[0.05] grayscale pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <BarChart3 size={14} className="text-indigo-600" />
                    {selectedModuleId === "" ? "Global Course Progress" : "Module Mastery Tracking"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 uppercase tracking-widest">
                       Accuracy Rank: S+
                    </span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {(() => {
                        const relevantLessons = selectedModuleId === "" ? lessons : lessons.filter(l => l.moduleId === Number(selectedModuleId));
                        if (relevantLessons.length === 0) return "0%";
                        const completed = relevantLessons.filter(l => l.completed).length;
                        return Math.round((completed / relevantLessons.length) * 100) + "%";
                      })()}
                    </span>
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-50 dark:bg-slate-950 rounded-full overflow-hidden p-1 border border-gray-100 dark:border-slate-800 shadow-inner">
                  <div 
                    style={{ 
                      width: (() => {
                        const relevantLessons = selectedModuleId === "" ? lessons : lessons.filter(l => l.moduleId === Number(selectedModuleId));
                        if (relevantLessons.length === 0) return "0%";
                        const completed = relevantLessons.filter(l => l.completed).length;
                        return (completed / relevantLessons.length) * 100 + "%";
                      })()
                    }}
                    className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-full shadow-lg transition-all duration-1000 ease-out"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                 <div className="px-8 py-5 bg-gray-50 dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 text-center min-w-[140px] shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Modules</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {(() => {
                        const relevantLessons = selectedModuleId === "" ? lessons : lessons.filter(l => l.moduleId === Number(selectedModuleId));
                        const completed = relevantLessons.filter(l => l.completed).length;
                        return `${completed}/${relevantLessons.length}`;
                      })()}
                    </p>
                 </div>
                 <div className="px-8 py-5 bg-gray-50 dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 text-center min-w-[140px] shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Phase</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                      {(() => {
                        const relevantLessons = selectedModuleId === "" ? lessons : lessons.filter(l => l.moduleId === Number(selectedModuleId));
                        if (relevantLessons.length === 0) return "N/A";
                        const allDone = relevantLessons.every(l => l.completed);
                        return allDone ? <><CheckCircle2 size={20}/> DONE</> : "ACTIVE";
                      })()}
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FILTERS ── */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm mb-16">
        <div className="flex flex-col lg:flex-row items-end gap-8">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-2">Selected Course</label>
            <div className="relative group">
              <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <select 
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value === "" ? "" : Number(e.target.value));
                  setSelectedModuleId("");
                }}
                className="w-full pl-16 pr-6 py-5 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-8 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200 appearance-none shadow-sm cursor-pointer"
              >
                <option value="">All Academic Courses</option>
                {availableCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 ml-2">Learning Module</label>
            <div className="relative group">
              <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <select 
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={!selectedCourseId || modulesLoading}
                className="w-full pl-16 pr-6 py-5 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-8 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200 appearance-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <option value="">Full Course Roadmap</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeLesson && (
        <div className="mb-20 animate-in fade-in zoom-in duration-500 max-w-6xl mx-auto">
          {isCourseCompleted && (
            <div className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-3xl flex items-center gap-5 shadow-sm">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-[0.2em] mb-1">Academic Status: Graduated</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">You've successfully completed this course. This lesson is now in Review Mode.</p>
              </div>
            </div>
          )}
          
          <div className="bg-black p-1.5 rounded-[3.5rem] shadow-2xl shadow-indigo-500/20 dark:shadow-none border-[6px] border-slate-900 dark:border-slate-800 overflow-hidden">
            {renderPlayer(activeLesson)}
          </div>

          <div className="mt-12 px-6 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex-1">
              <div className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                <div className="h-0.5 w-12 bg-indigo-600 dark:bg-indigo-400"></div>
                {activeLesson.course?.name || "Curriculum Lesson"}
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight mb-4">{activeLesson.title}</h2>
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                  Lesson Sequence #{activeLesson.order}
                </span>
                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                   {isCourseCompleted ? (
                     <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                       <CheckCircle2 size={16}/> Mastered
                     </span>
                   ) : activeLesson.completed ? (
                     <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                       <CheckCircle2 size={16}/> Completed
                     </span>
                   ) : (
                     <span className="text-amber-600 dark:text-amber-500 flex items-center gap-2">
                       <Clock size={16}/> In Progress
                     </span>
                   )}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
               {isAdmin && (
                 <>
                  <button onClick={() => handleEditInit(activeLesson)} className="p-4 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                      <Edit size={22} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(activeLesson.id)} className="p-4 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                      <Trash2 size={22} />
                  </button>
                 </>
               )}
               <button 
                onClick={() => {
                  setActiveLesson(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="flex items-center gap-3 bg-gray-900 dark:bg-slate-800 text-white dark:text-slate-200 px-8 py-4 rounded-2xl text-xs font-black hover:bg-black dark:hover:bg-slate-700 transition-all uppercase tracking-widest border border-transparent shadow-xl"
              >
                  <X size={18} /> Exit Theater
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LESSONS GRID ── */}
      <div className="flex items-center gap-4 mb-10">
         <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Available Lessons</h2>
         <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      </div>

      {lessonsLoading ? (
        <div className="flex justify-center py-32"><Loader /></div>
      ) : filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredLessons.map((lesson) => {
            const isLocked = !isAdmin && !lesson.unlocked;
            const ytMatch = lesson.videoUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/||.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            const isMp4 = lesson.videoUrl?.match(/\.(mp4|webm|ogg|mov)$/i) || lesson.videoType === "UPLOAD";
            
            return (
              <div 
                key={lesson.id} 
                onClick={() => {
                  if (isLocked) {
                    toast.error("Prerequisite Not Met: Complete the previous lesson to unlock this content.");
                    return;
                  }
                  setActiveLesson(lesson);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-[2rem] border transition-all flex flex-col h-full group cursor-pointer ${
                  activeLesson?.id === lesson.id 
                    ? "border-indigo-600 dark:border-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-900/20" 
                    : isLocked
                      ? "opacity-60 grayscale border-gray-100 dark:border-slate-800"
                      : "border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-2 dark:hover:shadow-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-900/50"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-56 w-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                  {ytMatch ? (
                    <img 
                      src={`https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`}
                      alt={lesson.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : isMp4 ? (
                    <video 
                      src={`${lesson.videoUrl}#t=0.1`} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                       <PlayCircle size={48} className="text-indigo-400/50 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  )}
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-500">
                      {isLocked ? <Lock size={24} /> : <PlayCircle size={32} />}
                    </div>
                  </div>

                  <div className="absolute top-5 right-5">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-indigo-600 dark:text-indigo-400 shadow-lg border border-indigo-50 dark:border-indigo-900/30 uppercase tracking-[0.2em]">
                      Step {lesson.order}
                    </span>
                  </div>
                  
                  {lesson.completed && (
                    <div className="absolute top-5 left-5">
                       <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                          <CheckCircle2 size={16} />
                       </div>
                    </div>
                  )}
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Mastery Content</span>
                  </div>

                  <h3 className={`text-2xl font-black mb-6 transition-colors leading-tight ${activeLesson?.id === lesson.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"}`}>
                    {lesson.title}
                  </h3>

                  <div className="mt-auto pt-6 border-t border-gray-50 dark:border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       {lesson.completed ? (
                         <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                           <CheckCircle2 size={14}/> Completed
                         </span>
                       ) : isLocked ? (
                         <span className="flex items-center gap-2 text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                           <Lock size={14}/> Restricted
                         </span>
                       ) : (
                         <span className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                           <PlayCircle size={14}/> Start Learning
                         </span>
                       )}
                    </div>
                    <ArrowRight size={18} className={`transition-all ${isLocked ? "text-gray-200" : "text-indigo-400 group-hover:translate-x-1"}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border border-dashed border-gray-200 dark:border-slate-800 transition-all">
          <div className="w-24 h-24 bg-gray-50 dark:bg-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-gray-300 dark:text-slate-700">
            <Video size={48} />
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">No Lectures Available</h3>
          <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto font-medium text-lg leading-relaxed">Select a course to view its curriculum or wait for the administrator to publish new modules.</p>
        </div>
      )}



      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete Lesson?"
        message="Are you sure you want to delete this lesson? This will also remove student progress for this specific lesson."
        confirmText="Delete Lesson"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Create Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-indigo-50 dark:border-indigo-900/20 p-8 sm:p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg text-white">
                <Layers size={20} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">New Module</h3>
            </div>
            
            <form onSubmit={handleCreateModule} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Module Title</label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="e.g. Module 1: Foundations"
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModuleModal(false);
                    setNewModuleTitle("");
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingModule || !newModuleTitle.trim()}
                  className="flex-1 px-6 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingModule ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


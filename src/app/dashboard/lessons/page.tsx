"use client";


import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getLessonsByCourse, createLesson, updateLesson, deleteLesson, Lesson } from "@/redux/slice/lessonSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { markLessonComplete } from "@/redux/slice/progressSlice";
import Loader from "@/components/Loader";
import { Plus, Video, PlayCircle, Upload, Link as LinkIcon, FileVideo, Lock, CheckCircle2, Edit, Trash2, X, Star, Layers, BarChart3, BookOpen, GraduationCap, ChevronRight, ArrowRight, Clock, Sparkles, Volume2, Headphones } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { UploadDropzone } from "@/lib/uploadthing";
import ConfirmModal from "@/components/ConfirmModal";

type UploadPhase = "idle" | "uploading" | "complete" | "error";

function getYoutubeId(url: string): string | null {
  const m = url.trim().match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.trim().match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

/** Accept YouTube, Vimeo, direct video files, or generic HTTPS (CDN). */
function isValidLessonVideoUrl(raw: string): boolean {
  const url = raw.trim();
  if (!url) return false;
  if (getYoutubeId(url)) return true;
  if (getVimeoId(url)) return true;
  if (/^https?:\/\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return true;
  if (/^https:\/\//i.test(url) && url.length > 12) return true;
  return false;
}

function AudioPlayerItem({
  url,
  order,
  title,
  onTimeUpdate,
  onEnded,
}: {
  url: string;
  order: number;
  title: string;
  onTimeUpdate: (e: any) => void;
  onEnded: () => void;
}) {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!audioElRef.current) return;
    if (isPlaying) {
      audioElRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error("Audio playback error:", err));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioElRef.current) return;
    const val = parseFloat(e.target.value);
    audioElRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const changeSpeed = () => {
    if (!audioElRef.current) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    audioElRef.current.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  const skip = (seconds: number) => {
    if (!audioElRef.current) return;
    audioElRef.current.currentTime = Math.max(0, Math.min(audioElRef.current.duration || 0, audioElRef.current.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 relative overflow-hidden flex flex-col items-center mb-6 last:mb-0 rounded-2xl">
      <audio
        ref={audioElRef}
        src={url}
        preload="metadata"
        onTimeUpdate={(e: any) => {
          setCurrentTime(e.target.currentTime);
          onTimeUpdate(e);
        }}
        onLoadedMetadata={(e: any) => setDuration(e.target.duration)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded();
        }}
        controlsList="nodownload"
        className="hidden"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="w-full flex items-center justify-between gap-4 mb-8 z-10">
        <div className="flex items-center gap-2">
          <Headphones size={18} className="text-indigo-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">
            Premium Audio Experience
          </span>
        </div>
        <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">
            Track {order}
          </span>
        </div>
      </div>
      <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 p-1 shadow-2xl relative flex items-center justify-center mb-8 z-10 group cursor-pointer" onClick={togglePlay}>
        <div className={`absolute inset-0 rounded-full bg-indigo-500/30 blur-md transition-all duration-700 ${isPlaying ? "scale-110 opacity-100 animate-ping" : "scale-100 opacity-0"}`} />
        <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center relative overflow-hidden">
          <Volume2 size={40} className={`text-indigo-400 transition-all duration-500 ${isPlaying ? "scale-110 rotate-3 text-indigo-300" : "scale-100"}`} />
          <div className="flex gap-1 items-end mt-4 h-6">
            <span className={`w-0.5 bg-indigo-400/80 rounded-full transition-all duration-350 ${isPlaying ? "animate-[pulse_1.2s_infinite_alternate] h-4" : "h-1"}`} />
            <span className={`w-0.5 bg-indigo-300/80 rounded-full transition-all duration-350 ${isPlaying ? "animate-[pulse_0.8s_infinite_alternate] h-6" : "h-1"}`} style={{ animationDelay: "0.2s" }} />
            <span className={`w-0.5 bg-indigo-400/80 rounded-full transition-all duration-350 ${isPlaying ? "animate-[pulse_1.5s_infinite_alternate] h-3" : "h-1"}`} style={{ animationDelay: "0.4s" }} />
            <span className={`w-0.5 bg-indigo-300/80 rounded-full transition-all duration-300 ${isPlaying ? "animate-[pulse_1s_infinite_alternate] h-5" : "h-1"}`} style={{ animationDelay: "0.1s" }} />
          </div>
        </div>
      </div>
      <div className="text-center max-w-lg mb-8 z-10">
        <h4 className="text-xl font-black text-white leading-tight uppercase tracking-tight mb-2">
          {title}
        </h4>
        <p className="text-xs text-slate-400 font-medium">Listen and take notes to complete this coursework</p>
      </div>
      <div className="w-full space-y-2 mb-8 z-10">
        <div className="flex items-center justify-between text-[11px] font-black text-slate-400 tracking-wider">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative group/slider w-full">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleTimeChange}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none accent-indigo-500 group-hover/slider:accent-indigo-400 transition-all"
            style={{ background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${(currentTime / (duration || 100)) * 100}%, #1e293b ${(currentTime / (duration || 100)) * 100}%, #1e293b 100%)` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between w-full gap-4 z-10">
        <button type="button" onClick={changeSpeed} className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-400 text-xs font-black uppercase tracking-widest border border-slate-700 transition-colors min-w-[70px]">{playbackSpeed.toFixed(2)}x</button>
        <div className="flex items-center gap-6">
          <button type="button" onClick={() => skip(-10)} className="p-3 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Rewind 10s">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>
          <button type="button" onClick={togglePlay} className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all">
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button type="button" onClick={() => skip(10)} className="p-3 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors" title="Forward 10s">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 min-w-[70px] justify-end">
          <button type="button" onClick={() => { if (!audioElRef.current) return; const newMuted = !isMuted; audioElRef.current.muted = newMuted; setIsMuted(newMuted); }} className="text-slate-400 hover:text-indigo-400 transition-colors">
            {isMuted || audioVolume === 0 ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            )}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : audioVolume} onChange={(e) => { if (!audioElRef.current) return; const val = parseFloat(e.target.value); audioElRef.current.volume = val; setAudioVolume(val); if (val > 0 && isMuted) { audioElRef.current.muted = false; setIsMuted(false); } }} className="w-12 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" />
        </div>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { lessons, loading: lessonsLoading } = useSelector((state: RootState) => state.lesson);
  const { courses } = useSelector((state: RootState) => state.course);
  const { enrollments } = useSelector((state: RootState) => state.enrollment);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = (currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN");

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
  const [isOpening, setIsOpening] = useState<number | null>(null);
  const [lastScrollPos, setLastScrollPos] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);

  // Audio player state and ref
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [playerMode, setPlayerMode] = useState<"video" | "audio">("video");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Reset audio state when active lesson or player mode changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackSpeed(1);
    
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.playbackRate = 1;
    }
  }, [activeLesson, playerMode]);

  // Auto-scroll to the specific lesson card when it becomes active
  useEffect(() => {
    if (activeLesson) {
      const activeCard = document.getElementById(`lesson-card-${activeLesson.id}`);
      if (activeCard) {
        const offset = 100;
        const elementPosition = activeCard.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  }, [activeLesson]);

  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    audioUrls: [] as string[],
    order: "",
  });

  // Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [formCourseId, setFormCourseId] = useState<number | "">("");
  const [formModuleId, setFormModuleId] = useState<number | "">("");
  const [formModules, setFormModules] = useState<{ id: number; title: string; order: number }[]>([]);
  const [formModulesLoading, setFormModulesLoading] = useState(false);

  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [audioUploadPhase, setAudioUploadPhase] = useState<UploadPhase>("idle");
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);

  const resetUploadState = () => {
    setUploadPhase("idle");
    setUploadProgress(0);
    setAudioUploadPhase("idle");
    setAudioUploadProgress(0);
  };

  const refreshLessonsList = async () => {
    const cid = selectedCourseId === "" ? 0 : Number(selectedCourseId);
    await dispatch(getLessonsByCourse(cid));
  };

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

  useEffect(() => {
    if (formCourseId === "" || formCourseId === 0) {
      setFormModules([]);
      setFormModuleId("");
      return;
    }
    const load = async () => {
      setFormModulesLoading(true);
      try {
        const res = await axios.get(`/api/admin/modules?courseId=${formCourseId}`);
        setFormModules(res.data.modules ?? []);
      } catch {
        setFormModules([]);
      } finally {
        setFormModulesLoading(false);
      }
    };
    load();
  }, [formCourseId]);

  const filteredLessons = lessons.filter(lesson => {
    if (selectedModuleId) {
      return lesson.moduleId === Number(selectedModuleId);
    }
    return true;
  });

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const cid =
      showForm && formCourseId !== ""
        ? Number(formCourseId)
        : selectedCourseId !== ""
          ? Number(selectedCourseId)
          : 0;
    if (!newModuleTitle.trim() || !cid) return;

    setIsCreatingModule(true);
    try {
      const moduleCount =
        showForm && formCourseId === cid ? formModules.length : modules.length;
      const res = await axios.post("/api/admin/modules", {
        title: newModuleTitle.trim(),
        courseId: cid,
        order: moduleCount + 1,
      });
      const created = res.data.module;
      if (selectedCourseId === cid) {
        setModules((prev) => [...prev, created]);
        setSelectedModuleId(created.id);
      }
      if (formCourseId === cid) {
        setFormModules((prev) => [...prev, created]);
        setFormModuleId(created.id);
      }
      setShowModuleModal(false);
      setNewModuleTitle("");
      toast.success("Module created successfully!");
    } catch {
      toast.error("Failed to create module");
    } finally {
      setIsCreatingModule(false);
    }
  };

  const openAddLessonModal = () => {
    setEditingLesson(null);
    resetUploadState();
    setFormData({ title: "", videoUrl: "", audioUrls: [], order: "" });
    setVideoSource("URL");
    const cid = selectedCourseId !== "" ? selectedCourseId : (courses[0]?.id ?? "");
    setFormCourseId(cid);
    setFormModuleId(selectedModuleId !== "" ? Number(selectedModuleId) : "");
    setShowForm(true);
  };

  const handleEditInit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedCourseId(lesson.courseId);
    setSelectedModuleId(lesson.moduleId);
    setFormCourseId(lesson.courseId);
    setFormModuleId(lesson.moduleId);
    setFormData({
      title: lesson.title,
      videoUrl: lesson.videoUrl || "",
      audioUrls: lesson.audioUrls || [],
      order: lesson.order.toString(),
    });
    setVideoSource(lesson.videoType || "URL");
    if (lesson.videoType === "UPLOAD" && lesson.videoUrl) {
      setUploadPhase("complete");
      setUploadProgress(100);
    } else {
      setUploadPhase("idle");
      setUploadProgress(0);
    }
    if (lesson.audioUrls && lesson.audioUrls.length > 0) {
      setAudioUploadPhase("complete");
      setAudioUploadProgress(100);
    } else {
      setAudioUploadPhase("idle");
      setAudioUploadProgress(0);
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLesson(null);
    setFormCourseId("");
    setFormModuleId("");
    setFormModules([]);
    resetUploadState();
    setFormData({ title: "", videoUrl: "", audioUrls: [], order: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || formCourseId === "" || formModuleId === "") {
      toast.error("Course, module, and title are required.");
      return;
    }

    const ord = editingLesson ? parseInt(formData.order, 10) : 0;
    if (editingLesson && (Number.isNaN(ord) || ord < 1)) {
      toast.error("Order must be a positive number.");
      return;
    }

    const hasVideo = formData.videoUrl.trim() !== "";
    const hasAudio = formData.audioUrls.length > 0;

    if (!hasVideo && !hasAudio) {
      toast.error("At least one media type (Video or Audio) is required.");
      return;
    }

    if (hasVideo) {
      if (videoSource === "UPLOAD") {
        if (uploadPhase === "uploading") {
          toast.error("Wait for the video upload to finish.");
          return;
        }
        if (!editingLesson && uploadPhase !== "complete") {
          toast.error("Video upload must reach 100% before creating a new lesson.");
          return;
        }
      } else if (!isValidLessonVideoUrl(formData.videoUrl)) {
        toast.error("Enter a valid YouTube, Vimeo, or HTTPS video URL.");
        return;
      }
    }

    if (hasAudio) {
      if (audioUploadPhase === "uploading") {
        toast.error("Wait for the audio upload to finish.");
        return;
      }
    }

    const payload: any = {
      title: formData.title.trim(),
      courseId: Number(formCourseId),
      moduleId: Number(formModuleId),
      videoType: hasVideo ? videoSource : null,
      videoUrl: hasVideo ? formData.videoUrl.trim() : null,
      audioUrls: hasAudio ? formData.audioUrls : [],
    };

    if (editingLesson) {
      payload.order = ord;
      const res = await dispatch(updateLesson({ id: editingLesson.id, data: payload }));
      if (updateLesson.fulfilled.match(res)) {
        handleCancel();
        await refreshLessonsList();
      }
    } else {
      const res = await dispatch(createLesson(payload));
      if (createLesson.fulfilled.match(res)) {
        setSelectedCourseId(Number(formCourseId));
        setSelectedModuleId(Number(formModuleId));
        handleCancel();
        await dispatch(getLessonsByCourse(Number(formCourseId)));
      }
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

  const videoRequirementMet = formData.videoUrl.trim() === "" || (
    videoSource === "URL"
      ? isValidLessonVideoUrl(formData.videoUrl)
      : uploadPhase === "complete" ||
        (Boolean(editingLesson) && Boolean(formData.videoUrl.trim()))
  );

  const audioRequirementMet = formData.audioUrls.length === 0 || (
    audioUploadPhase === "complete" || (Boolean(editingLesson) && formData.audioUrls.length > 0)
  );

  const hasAtLeastOneMedia = Boolean(formData.videoUrl.trim()) || formData.audioUrls.length > 0;

  const lessonFormSubmitReady =
    Boolean(formData.title.trim()) &&
    formCourseId !== "" &&
    formModuleId !== "" &&
    videoRequirementMet &&
    audioRequirementMet &&
    hasAtLeastOneMedia &&
    !(videoSource === "UPLOAD" && uploadPhase === "uploading") &&
    audioUploadPhase !== "uploading";

  const renderPlayer = (lesson: any) => {
    const handleEnded = () => handleLessonComplete(lesson.id);

    // Watch progress threshold (95%)
    const handleTimeUpdate = (e: any) => {
      const media = e.target;
      const progress = (media.currentTime / media.duration) * 100;
      if (progress >= 95 && !lesson.completed && !isAdmin) {
        // We could auto-complete here, but onEnded is safer for "fully watched"
      }
    };

    const renderVideoPlayer = () => {
      if (!lesson.videoUrl) return null;
      if (lesson.videoType === "URL") {
        const ytId = getYoutubeId(lesson.videoUrl);
        if (ytId) {
          return (
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black relative">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1`}
                title={lesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        const vimeoId = getVimeoId(lesson.videoUrl);
        if (vimeoId) {
          return (
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black relative">
              <iframe
                className="w-full h-full"
                src={`https://player.vimeo.com/video/${vimeoId}`}
                title={lesson.title}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        return (
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
            <video 
              controls 
              className="w-full h-full" 
              onEnded={!lesson.audioUrl ? handleEnded : undefined}
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
              onEnded={!lesson.audioUrl ? handleEnded : undefined}
              onTimeUpdate={handleTimeUpdate}
            >
              <source src={lesson.videoUrl} type="video/mp4" />
            </video>
          </div>
        );
      }
    };

    const renderAudioPlayers = () => {
      if (!lesson.audioUrls || lesson.audioUrls.length === 0) return null;
      return (
        <div className="flex flex-col gap-4">
          {lesson.audioUrls.map((audioUrl: string, idx: number) => (
            <AudioPlayerItem 
              key={idx}
              url={audioUrl}
              order={idx + 1}
              title={`${lesson.title} - Audio ${idx + 1}`}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />
          ))}
        </div>
      );
    };

    const hasVideo = !!lesson.videoUrl;
    const hasAudio = lesson.audioUrls && lesson.audioUrls.length > 0;

    return (
      <div className="w-full relative flex flex-col">
        {/* Toggle Mode Bar if BOTH are present */}
        {hasVideo && hasAudio && (
          <div className="flex bg-slate-900/60 p-1.5 rounded-2xl w-full max-w-xs mx-auto my-4 border border-slate-800">
            <button
              type="button"
              onClick={() => setPlayerMode("video")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                playerMode === "video"
                  ? "bg-indigo-600 shadow-lg text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Video size={14} /> Video
            </button>
            <button
              type="button"
              onClick={() => setPlayerMode("audio")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                playerMode === "audio"
                  ? "bg-indigo-600 shadow-lg text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Headphones size={14} /> Audio
            </button>
          </div>
        )}

        {/* Render selected player */}
        {playerMode === "video" && hasVideo && renderVideoPlayer()}
        {(playerMode === "audio" || !hasVideo) && hasAudio && renderAudioPlayers()}
        
      </div>
    );
  };

  const renderLessonCard = (lesson: any) => {
    const isLocked = !isAdmin && !lesson.unlocked;
    const ytId = lesson.videoUrl ? getYoutubeId(lesson.videoUrl) : null;
    const isMp4 =
      lesson.videoUrl?.match(/\.(mp4|webm|ogg|mov)$/i) ||
      lesson.videoType === "UPLOAD";

    return (
      <div
        key={lesson.id}
        id={`lesson-card-${lesson.id}`}
        className={`bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-[2rem] border transition-all flex flex-col h-full group ${
          activeLesson?.id === lesson.id
            ? "border-indigo-600 dark:border-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-900/20 md:col-span-2 lg:col-span-3"
            : isOpening === lesson.id
              ? "border-amber-400 ring-4 ring-amber-100 animate-pulse"
              : isLocked
                ? "opacity-60 grayscale border-gray-100 dark:border-slate-800"
                : "border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-2 dark:hover:shadow-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-900/50 cursor-pointer"
        }`}
        onClick={() => {
          if (activeLesson?.id === lesson.id) return;
          if (isLocked) {
            if (lesson.dailyLocked) {
              const unlockDate = lesson.nextUnlockTime ? new Date(lesson.nextUnlockTime).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'tomorrow';
              toast.error(
                `Daily Limit Reached: You have 0 credits. Next lesson unlocks ${unlockDate}.`
              );
            } else {
              toast.error(
                "Prerequisite Not Met: Complete the previous lesson to unlock this content."
              );
            }
            return;
          }
          if (isOpening) return;

          setIsOpening(lesson.id);
          setTimeout(() => {
            setActiveLesson(lesson);
            setPlayerMode(lesson.videoUrl ? "video" : "audio");
            setIsOpening(null);
          }, 500);
        }}
      >
        {/* Player or Thumbnail */}
        {activeLesson?.id === lesson.id ? (
          <div className="w-full bg-black relative animate-in fade-in zoom-in duration-500 overflow-hidden">
            {renderPlayer(lesson)}
          </div>
        ) : (
          <div className="relative h-56 w-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
            {ytId ? (
              <img
                src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
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
            ) : (lesson.audioUrls && lesson.audioUrls.length > 0) ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 p-6 relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 flex items-center justify-center shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Headphones size={32} className="text-indigo-400 animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.25em] bg-indigo-500/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-indigo-500/10 shadow-inner">
                  Audio Lecture
                </span>
                
                {/* Visualizer bars */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 items-end h-8">
                  <span className="w-1 bg-indigo-400/40 rounded-full h-3 group-hover:h-6 transition-all duration-500 delay-75" />
                  <span className="w-1 bg-indigo-300/60 rounded-full h-5 group-hover:h-8 transition-all duration-500 delay-100" />
                  <span className="w-1 bg-indigo-400/80 rounded-full h-4 group-hover:h-7 transition-all duration-500 delay-150" />
                  <span className="w-1 bg-indigo-300/60 rounded-full h-6 group-hover:h-4 transition-all duration-500 delay-75" />
                  <span className="w-1 bg-indigo-400/40 rounded-full h-3 group-hover:h-5 transition-all duration-500 delay-200" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                <PlayCircle
                  size={48}
                  className="text-indigo-400/50 group-hover:text-indigo-400 transition-colors"
                />
              </div>
            )}

            {/* Play Overlay */}
            <div
              className={`absolute inset-0 backdrop-blur-[2px] flex items-center justify-center transition-all duration-500 ${
                isOpening === lesson.id
                  ? "bg-amber-600/20 opacity-100"
                  : "bg-indigo-600/10 opacity-0 group-hover:opacity-100"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-500 ${
                  isOpening === lesson.id
                    ? "bg-amber-500 text-white scale-110"
                    : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 scale-75 group-hover:scale-100"
                }`}
              >
                {isLocked ? (
                  <Lock size={24} />
                ) : isOpening === lesson.id ? (
                  <Loader />
                ) : !lesson.videoUrl && lesson.audioUrl ? (
                  <Headphones size={32} />
                ) : (
                  <PlayCircle size={32} />
                )}
              </div>
              {isOpening === lesson.id && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg">
                    Opening Lesson...
                  </span>
                </div>
              )}
            </div>
            <div className="absolute top-5 right-5">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-indigo-600 dark:text-indigo-400 shadow-lg border border-indigo-50 dark:border-indigo-900/30 uppercase tracking-[0.2em]">
                Lesson {lesson.order}
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
        )}

        <div className="p-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className="text-amber-400 fill-amber-400"
                />
              ))}
              <span className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">
                Mastery Content
              </span>
            </div>
            {activeLesson?.id === lesson.id && (
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-lg animate-bounce">
                Now Playing
              </span>
            )}
          </div>

          <h3
            className={`text-2xl font-black mb-6 transition-colors leading-tight ${activeLesson?.id === lesson.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"}`}
          >
            {lesson.title}
          </h3>

          <div className="mt-auto pt-6 border-t border-gray-50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {lesson.completed ? (
                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  <CheckCircle2 size={14} /> Completed
                </span>
              ) : isLocked ? (
                <span className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  <Lock size={14} /> {lesson.dailyLocked ? "Daily Limit" : "Restricted"}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  <PlayCircle size={14} />{" "}
                  {activeLesson?.id === lesson.id
                    ? "Playing Now"
                    : "Start Learning"}
                </span>
              )}

              {/* Explicit "Listen to Audio" option for audio-enabled lessons */}
              {lesson.audioUrls && lesson.audioUrls.length > 0 && !isLocked && activeLesson?.id !== lesson.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOpening) return;
                    setIsOpening(lesson.id);
                    setTimeout(() => {
                      setActiveLesson(lesson);
                      setPlayerMode("audio");
                      setIsOpening(null);
                    }, 500);
                  }}
                  className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-100/50 dark:border-indigo-900/30"
                >
                  <Headphones size={12} className="animate-pulse" />
                  Listen Lesson's Audio
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {activeLesson?.id === lesson.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLesson(null);
                  }}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700"
                >
                  <X size={14} /> Close Player
                </button>
              )}
              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditInit(lesson);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(lesson.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <ArrowRight
                size={18}
                className={`transition-all ${isLocked ? "text-gray-200" : "text-indigo-400 group-hover:translate-x-1"}`}
              />
            </div>
          </div>
        </div>
      </div>
    );
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
             type="button"
             onClick={() => (showForm ? handleCancel() : openAddLessonModal())}
             className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl transition-all shadow-xl font-black text-xs uppercase tracking-widest ${
               showForm 
                 ? "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700" 
                 : "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-indigo-100 dark:shadow-none hover:-translate-y-1"
             }`}
           >
             {showForm ? <X size={18} /> : <><Plus size={18} /> Add Lesson</>}
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

              <div className="flex gap-4 lg:gap-6 flex-wrap">
                 <div className="px-6 py-5 bg-gray-50 dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 text-center min-w-[120px] shadow-sm flex-1">
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Daily Credits</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex justify-center items-center gap-2">
                      <Sparkles size={18} /> {lessons[0]?.availableCredits ?? 0}
                    </p>
                 </div>
                 <div className="px-6 py-5 bg-gray-50 dark:bg-slate-950 rounded-[2rem] border border-gray-100 dark:border-slate-800 text-center min-w-[120px] shadow-sm flex-1">
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
                {modules.map(m => {
                  const prefix = `Module ${m.order}`;
                  const displayTitle = m.title.toLowerCase().startsWith(prefix.toLowerCase()) 
                    ? m.title 
                    : `${prefix}: ${m.title}`;
                  return <option key={m.id} value={m.id}>{displayTitle}</option>;
                })}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* ── LESSONS GRID ── */}
      <div className="flex items-center gap-4 mb-10">
         <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Available Lessons</h2>
         <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      </div>

      {lessonsLoading ? (
        <div className="flex justify-center py-32"><Loader /></div>
      ) : (
        filteredLessons.length > 0 ? (
        <div className="space-y-16">
          {modules.length > 0 ? (
            modules.map((module) => {
              const moduleLessons = filteredLessons.filter(l => l.moduleId === module.id);
              if (moduleLessons.length === 0) return null;

              return (
                <div key={module.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none">
                      Module {module.order}
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {module.title}
                    </h3>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {moduleLessons.map((lesson) => (
                      renderLessonCard(lesson)
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLessons.map((lesson) => (
                renderLessonCard(lesson)
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border border-dashed border-gray-200 dark:border-slate-800 transition-all">
          <div className="w-24 h-24 bg-gray-50 dark:bg-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-gray-300 dark:text-slate-700">
            <Video size={48} />
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">No Lectures Available</h3>
          <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto font-medium text-lg leading-relaxed">Select a course to view its curriculum or wait for the administrator to publish new modules.</p>
        </div>
      ))}


      {isAdmin && showForm && (
        <div
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-form-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close lesson form"
            onClick={handleCancel}
          />
          <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 p-2 rounded-xl bg-indigo-600 text-white">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
                    Lesson workspace
                  </p>
                  <h2
                    id="lesson-form-title"
                    className="text-lg font-black text-gray-900 dark:text-white truncate uppercase tracking-tight"
                  >
                    {editingLesson ? "Edit Lesson" : "Create Lesson"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors shrink-0"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 pb-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  Target course
                </label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <select
                    required
                    value={formCourseId === "" ? "" : formCourseId}
                    onChange={(e) => {
                      const v = e.target.value === "" ? "" : Number(e.target.value);
                      setFormCourseId(v);
                      setFormModuleId("");
                    }}
                    className="w-full pl-12 pr-10 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-gray-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 appearance-none cursor-pointer"
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Target module
                  </label>
                  <button
                    type="button"
                    disabled={formCourseId === "" || formModulesLoading}
                    onClick={() => setShowModuleModal(true)}
                    className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Plus size={14} /> Create New Module
                  </button>
                </div>
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                  <select
                    required
                    value={formModuleId === "" ? "" : formModuleId}
                    onChange={(e) =>
                      setFormModuleId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    disabled={formCourseId === "" || formModulesLoading}
                    className="w-full pl-12 pr-10 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold disabled:opacity-50 outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 appearance-none cursor-pointer"
                  >
                    <option value="">
                      {formModulesLoading ? "Loading modules…" : "Select a module"}
                    </option>
                    {formModules.map((m) => {
                      const prefix = `Module ${m.order}`;
                      const displayTitle = m.title.toLowerCase().startsWith(prefix.toLowerCase()) 
                        ? m.title 
                        : `${prefix}: ${m.title}`;
                      return (
                        <option key={m.id} value={m.id}>
                          {displayTitle}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Lesson title
                  </label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 font-bold outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                    placeholder="Introduction to Flexbox"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Lesson Video (Optional)
                </label>
                <div className="flex rounded-2xl border border-gray-100 dark:border-slate-800 p-1 bg-gray-50 dark:bg-slate-950">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSource("URL");
                      resetUploadState();
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      videoSource === "URL"
                        ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    <LinkIcon size={16} /> Use URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoSource("UPLOAD");
                      setFormData((p) => ({ ...p, videoUrl: "" }));
                      resetUploadState();
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      videoSource === "UPLOAD"
                        ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    <Upload size={16} /> Upload Video
                  </button>
                </div>

                {videoSource === "URL" ? (
                  <div className="space-y-2">
                    <input
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 font-medium text-sm outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                      placeholder="YouTube, Vimeo, or MP4 URL"
                    />
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      YouTube, Vimeo, direct MP4/WebM, or HTTPS CDN URLs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-6">
                    <UploadDropzone
                      endpoint="videoUploader"
                      uploadProgressGranularity="fine"
                      onUploadBegin={() => {
                        setUploadPhase("uploading");
                        setUploadProgress(0);
                        setFormData((p) => ({ ...p, videoUrl: "" }));
                      }}
                      onUploadProgress={(p) => setUploadProgress(Math.round(p))}
                      onClientUploadComplete={(res) => {
                        const first = res?.[0] as { url?: string; ufsUrl?: string } | undefined;
                        const url = first?.url ?? first?.ufsUrl ?? "";
                        if (url) {
                          setFormData((p) => ({ ...p, videoUrl: url }));
                          setUploadPhase("complete");
                          setUploadProgress(100);
                          toast.success("Video uploaded successfully");
                        }
                      }}
                      onUploadError={(e) => {
                        setUploadPhase("error");
                        toast.error(e.message || "Upload failed");
                      }}
                      appearance={{
                        container: "border-0 bg-transparent items-center",
                        uploadIcon: "text-indigo-600 dark:text-indigo-400",
                        button:
                          "bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl px-6 py-3 transition-colors",
                      }}
                      content={{
                        label: ({ ready, isUploading, uploadProgress: prog }) =>
                          !ready
                            ? "Preparing uploader…"
                            : isUploading
                              ? `Uploading… ${Math.round(prog)}%`
                              : "Drop a video here or click to browse",
                      }}
                    />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            uploadPhase === "complete"
                              ? "bg-emerald-500"
                              : uploadPhase === "error"
                                ? "bg-red-500"
                                : "bg-indigo-600"
                          }`}
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
                        {uploadPhase === "idle" && "No upload in progress"}
                        {uploadPhase === "uploading" && `Uploading… ${uploadProgress}%`}
                        {uploadPhase === "complete" && "100% — Ready to create lesson"}
                        {uploadPhase === "error" && "Upload failed — try again"}
                      </p>
                    </div>
                    {formData.videoUrl && uploadPhase === "complete" && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-black aspect-video">
                        <video
                          src={`${formData.videoUrl}#t=0.1`}
                          controls
                          className="w-full h-full"
                          preload="metadata"
                          playsInline
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Lesson Audio (Optional)
                </label>
                <div className="space-y-4 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-6">
                  {formData.audioUrls.length > 0 && (
                    <div className="flex flex-col gap-4 mb-6">
                      {formData.audioUrls.map((url, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Audio {idx + 1}</span>
                          </div>
                          <audio controls className="w-full sm:w-1/2 h-10">
                            <source src={url} type="audio/mpeg" />
                          </audio>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(p => ({
                                ...p,
                                audioUrls: p.audioUrls.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors shrink-0 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4 text-center">Add Audio File</p>
                    <UploadDropzone
                      endpoint="audioUploader"
                      uploadProgressGranularity="fine"
                      onUploadBegin={() => {
                        setAudioUploadPhase("uploading");
                        setAudioUploadProgress(0);
                      }}
                      onUploadProgress={(p) => setAudioUploadProgress(Math.round(p))}
                      onClientUploadComplete={(res) => {
                        const first = res?.[0] as { url?: string; ufsUrl?: string } | undefined;
                        const url = first?.url ?? first?.ufsUrl ?? "";
                        if (url) {
                          setFormData((p) => ({ ...p, audioUrls: [...p.audioUrls, url] }));
                          setAudioUploadPhase("idle");
                          setAudioUploadProgress(0);
                          toast.success("Audio uploaded successfully");
                        }
                      }}
                      onUploadError={(e) => {
                        setAudioUploadPhase("error");
                        toast.error(e.message || "Audio upload failed");
                      }}
                      appearance={{
                        container: "border-0 bg-transparent items-center",
                        uploadIcon: "text-indigo-600 dark:text-indigo-400",
                        button:
                          "bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl px-6 py-3 transition-colors",
                      }}
                      content={{
                        label: ({ ready, isUploading, uploadProgress: prog }) =>
                          !ready
                            ? "Preparing uploader…"
                            : isUploading
                              ? `Uploading… ${Math.round(prog)}%`
                              : "Drop an audio file here or click to browse",
                      }}
                    />
                    <div className="space-y-2 mt-4">
                      <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            audioUploadPhase === "complete"
                              ? "bg-emerald-500"
                              : audioUploadPhase === "error"
                                ? "bg-red-500"
                                : "bg-indigo-600"
                          }`}
                          style={{ width: `${audioUploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-center">
                        {audioUploadPhase === "idle" && "No upload in progress"}
                        {audioUploadPhase === "uploading" && `Uploading… ${audioUploadProgress}%`}
                        {audioUploadPhase === "complete" && "100% — Ready to save"}
                        {audioUploadPhase === "error" && "Upload failed — try again"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!lessonFormSubmitReady || lessonsLoading}
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 dark:shadow-none transition-colors"
                >
                  {lessonsLoading ? "Saving…" : editingLesson ? "Update Lesson" : "Create Lesson"}
                </button>
              </div>
            </form>
          </div>
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

"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getLessonsByCourse, createLesson, updateLesson, deleteLesson, Lesson } from "@/redux/slice/lessonSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { markLessonComplete } from "@/redux/slice/progressSlice";
import Loader from "@/components/Loader";
import { Plus, Video, PlayCircle, Upload, Link as LinkIcon, FileVideo, HardDrive, Lock, CheckCircle2, Edit, Trash2, X } from "lucide-react";
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
    dispatch(getLessonsByCourse(0));
  }, [dispatch, isAdmin]);

  const availableCourses = isAdmin 
    ? courses 
    : enrollments
        .filter(e => e.status === "APPROVED")
        .map(e => ({ id: e.courseId, name: e.course?.name || "Unknown Course" }));

  useEffect(() => {
    const cid = selectedCourseId === "" ? 0 : Number(selectedCourseId);
    dispatch(getLessonsByCourse(cid));
    setActiveLesson(null);
  }, [selectedCourseId, dispatch]);

  const handleEditInit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedCourseId(lesson.courseId);
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
    setFormData({ title: "", videoUrl: "", order: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.order || !selectedCourseId || !formData.videoUrl) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      order: parseInt(formData.order, 10),
      courseId: Number(selectedCourseId),
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

  const handleLessonComplete = async (lessonId: number) => {
    if (isAdmin) return;
    
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
      dispatch(getLessonsByCourse(selectedCourseId === "" ? 0 : Number(selectedCourseId)));
      toast.success("Progress saved!");
    }
  };

  const renderPlayer = (lesson: any) => {
    const handleEnded = () => handleLessonComplete(lesson.id);

    if (lesson.videoType === "URL") {
      const ytMatch = lesson.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/||.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (ytMatch) {
        return (
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${ytMatch[1]}?enablejsapi=1`}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            {!isAdmin && (
              <div className="absolute bottom-4 right-4">
                <button 
                  onClick={handleEnded}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Mark as Completed
                </button>
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
          <video controls className="w-full h-full" onEnded={handleEnded}>
            <source src={lesson.videoUrl} type="video/mp4" />
          </video>
        </div>
      );
    } else {
      return (
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video controls controlsList="nodownload" className="w-full h-full" onEnded={handleEnded}>
            <source src={lesson.videoUrl} type="video/mp4" />
          </video>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 transition-colors duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Learning Center</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Explore all your enrolled modules or filter by course.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value === "" ? "" : Number(e.target.value))}
            className="appearance-none block w-full sm:w-64 pl-4 pr-10 py-2.5 text-sm font-black border border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl bg-white dark:bg-slate-900 shadow-sm transition-all text-gray-700 dark:text-slate-200"
          >
            <option value="">All Enrolled Courses</option>
            {availableCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {isAdmin && (
            <button
              onClick={() => (showForm ? handleCancel() : setShowForm(true))}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-md text-sm font-black whitespace-nowrap uppercase tracking-widest ${
                showForm ? "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700" : "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
              }`}
            >
              {showForm ? <X size={18} /> : <><Plus size={18} /> Add Lesson</>}
            </button>
          )}
        </div>
      </div>

      {activeLesson && (
        <div className="mb-12 animate-in fade-in zoom-in duration-500">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl border border-indigo-50 dark:border-indigo-900/20">
            {renderPlayer(activeLesson)}
          </div>
          <div className="mt-8 px-4 flex justify-between items-start">
            <div>
              <div className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-indigo-600 dark:bg-indigo-400"></span>
                {activeLesson.course?.name || "Course Module"}
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{activeLesson.title}</h2>
              <div className="flex items-center gap-4 text-gray-400 dark:text-slate-500 mt-2 text-xs font-black uppercase tracking-widest">
                <span className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full text-gray-600 dark:text-slate-400">Module {activeLesson.order}</span>
                <span className="flex items-center gap-1.5 font-bold">
                   {activeLesson.completed ? <><CheckCircle2 size={14} className="text-green-500 dark:text-green-400"/> Completed</> : "In Progress"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
               {isAdmin && (
                 <>
                  <button onClick={() => handleEditInit(activeLesson)} className="p-3 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all">
                      <Edit size={20} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(activeLesson.id)} className="p-3 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all">
                      <Trash2 size={20} />
                  </button>
                 </>
               )}
               <button 
                onClick={() => setActiveLesson(null)} 
                className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-4 py-2 rounded-xl text-xs font-black hover:bg-gray-200 dark:hover:bg-slate-700 transition-all uppercase tracking-widest border border-gray-200/50 dark:border-slate-700"
              >
                  <X size={14} /> Close Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-indigo-50 dark:border-indigo-900/20 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg"><Video className="text-white" size={20} /></div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{editingLesson ? "Edit Lesson Details" : "Publish New Module"}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Academic Research"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Order / Position</label>
                <input
                  type="number"
                  required
                  placeholder="1, 2, 3..."
                  value={formData.order}
                  onChange={e => setFormData({...formData, order: e.target.value})}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
               <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Target Course</label>
               <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                >
                  <option value="">Select Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="md:col-span-3 space-y-4">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Video Source</label>
                <div className="flex gap-4 p-1 bg-gray-100 dark:bg-slate-950 rounded-2xl w-fit border border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setVideoSource("URL")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                      videoSource === "URL" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <LinkIcon size={14} />
                    Video URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSource("UPLOAD")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                      videoSource === "UPLOAD" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Upload size={14} />
                    Direct Upload
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2">
                    {videoSource === "URL" ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="Paste YouTube or MP4 link here..."
                          value={formData.videoUrl}
                          onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                          className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                        />
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 ml-1 uppercase tracking-widest">Supports YouTube, Vimeo, and direct MP4 links</p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2rem] p-10 text-center hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors bg-gray-50/50 dark:bg-slate-950/50">
                        <UploadButton
                          endpoint="courseImageUploader"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                              setFormData({ ...formData, videoUrl: res[0].url });
                              toast.success("Video uploaded!");
                            }
                          }}
                          onUploadError={(error: Error) => {
                            toast.error(`Upload failed: ${error.message}`);
                          }}
                          appearance={{
                            button: "bg-indigo-600 dark:bg-indigo-500 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all after:bg-indigo-700",
                            allowedContent: "text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-3 uppercase tracking-widest"
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800">
                      <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Preview Status</h4>
                      {formData.videoUrl ? (
                        <div className="space-y-4">
                           <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-slate-800">
                              <video src={formData.videoUrl} className="w-full h-full" />
                           </div>
                           <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle2 size={12} /> Video Source Ready
                           </p>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center text-gray-300 dark:text-slate-700 gap-2">
                          <FileVideo size={32} />
                          <span className="text-[10px] font-black uppercase tracking-widest">No Video</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-4 rounded-2xl text-xs font-black text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-10 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 uppercase tracking-widest"
              >
                {editingLesson ? "Save Changes" : "Publish Module"}
              </button>
            </div>
          </form>
        </div>
      )}

      {lessonsLoading ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : lessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div 
              key={lesson.id} 
              onClick={() => {
                setActiveLesson(lesson);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer hover:-translate-y-1 shadow-sm hover:shadow-xl dark:hover:shadow-indigo-950/20 ${
                activeLesson?.id === lesson.id 
                  ? "border-indigo-600 dark:border-indigo-400 ring-1 ring-indigo-600 dark:ring-indigo-400" 
                  : "border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  activeLesson?.id === lesson.id 
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white" 
                    : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"
                }`}>
                  <PlayCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-black text-sm truncate ${activeLesson?.id === lesson.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-slate-100"}`}>{lesson.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Module {lesson.order}</span>
                    {lesson.completed && <CheckCircle2 size={14} className="text-green-500 dark:text-green-400" />}
                  </div>
                </div>
                <PlayCircle size={18} className="text-gray-300 dark:text-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-gray-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-gray-50 dark:bg-slate-950 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-slate-700">
            <Video size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No modules found</h3>
          <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto font-medium">This course doesn't have any published lessons yet.</p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete Lesson?"
        message="Are you sure you want to delete this module? This will also remove student progress for this specific lesson."
        confirmText="Delete Lesson"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

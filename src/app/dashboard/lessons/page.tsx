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
    
    const res = await dispatch(markLessonComplete({ 
      courseId: lessons.find(l => l.id === lessonId)?.courseId || 0, 
      lessonId 
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
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Learning Center</h1>
          <p className="text-gray-500 mt-1">Explore all your enrolled modules or filter by course.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value === "" ? "" : Number(e.target.value))}
            className="appearance-none block w-full sm:w-64 pl-4 pr-10 py-2.5 text-sm font-bold border border-gray-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl bg-white shadow-sm transition-all text-gray-700"
          >
            <option value="">All Enrolled Courses</option>
            {availableCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {isAdmin && (
            <button
              onClick={() => (showForm ? handleCancel() : setShowForm(true))}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-md text-sm font-black whitespace-nowrap ${
                showForm ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {showForm ? <X size={18} /> : <><Plus size={18} /> Add Lesson</>}
            </button>
          )}
        </div>
      </div>

      {activeLesson && (
        <div className="mb-12 animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-indigo-50">
            {renderPlayer(activeLesson)}
          </div>
          <div className="mt-8 px-4 flex justify-between items-start">
            <div>
              <div className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-8 h-[2px] bg-indigo-600"></span>
                {activeLesson.course?.name || "Course Module"}
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{activeLesson.title}</h2>
              <div className="flex items-center gap-4 text-gray-400 mt-2 text-xs font-bold uppercase tracking-tighter">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-600">Module {activeLesson.order}</span>
                <span className="flex items-center gap-1.5">
                   {activeLesson.completed ? <><CheckCircle2 size={14} className="text-green-500"/> Completed</> : "In Progress"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
               {isAdmin && (
                 <>
                  <button onClick={() => handleEditInit(activeLesson)} className="p-3 bg-white text-gray-400 hover:text-indigo-600 rounded-2xl border border-gray-100 shadow-sm transition-all">
                      <Edit size={20} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(activeLesson.id)} className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-2xl border border-gray-100 shadow-sm transition-all">
                      <Trash2 size={20} />
                  </button>
                 </>
               )}
               <button 
                onClick={() => setActiveLesson(null)} 
                className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-black hover:bg-gray-200 transition-all uppercase tracking-widest border border-gray-200/50"
              >
                  <X size={14} /> Close Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-50 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-indigo-600 rounded-lg"><Video className="text-white" size={20} /></div>
            <h2 className="text-2xl font-black text-gray-900">{editingLesson ? "Edit Lesson Details" : "Publish New Module"}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lesson Title</label>
                <input
                  type="text"
                  placeholder="e.g. 01. Introduction"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sequence Order</label>
                <input
                  type="number"
                  placeholder="1"
                  value={formData.order}
                  onChange={e => setFormData({...formData, order: e.target.value})}
                  className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800"
                />
              </div>
            </div>

            <div>
               <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Target Course</label>
               <select 
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800"
                >
                  <option value="">Select Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Video Delivery Method</label>
              <div className="flex gap-4 p-1.5 bg-gray-100 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setVideoSource("URL")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                    videoSource === "URL" ? "bg-white text-indigo-600 shadow-md" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LinkIcon size={16} />
                  Streaming Link
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSource("UPLOAD")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                    videoSource === "UPLOAD" ? "bg-white text-indigo-600 shadow-md" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <HardDrive size={16} />
                  Direct Upload
                </button>
              </div>
            </div>

            {videoSource === "URL" ? (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Streaming URL</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                  placeholder="Paste YouTube or MP4 link here..."
                  className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-medium text-gray-700"
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Master Source Upload (Max 2GB)</label>
                {formData.videoUrl ? (
                  <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500 p-3 rounded-xl shadow-lg shadow-green-100"><PlayCircle className="text-white" size={24} /></div>
                      <div>
                        <p className="text-green-800 font-black">Video Ready for Stream</p>
                        <p className="text-green-600/70 text-xs truncate max-w-xs">{formData.videoUrl}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, videoUrl: ""})} className="text-xs font-black text-red-500 bg-white px-4 py-2 rounded-xl shadow-sm hover:bg-red-50 transition-colors">Replace</button>
                  </div>
                ) : (
                  <div className="bg-indigo-50/20 rounded-[2rem] p-2 border-2 border-dashed border-indigo-100 transition-colors hover:border-indigo-200">
                    <UploadDropzone
                      endpoint="videoUploader"
                      onClientUploadComplete={(res) => {
                        setFormData({ ...formData, videoUrl: res[0].url });
                        toast.success("Upload Successful!");
                      }}
                      onUploadError={(error: Error) => toast.error(`Upload Failed: ${error.message}`)}
                      className="ut-label:text-indigo-600 ut-button:bg-indigo-600 ut-button:rounded-xl ut-allowed-content:text-indigo-400/70"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
              <button type="button" onClick={handleCancel} className="px-8 py-4 text-gray-500 font-bold">Discard</button>
              <button type="submit" className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                {editingLesson ? "Save Changes" : "Publish Module"}
              </button>
            </div>
          </form>
        </div>
      )}

      {lessonsLoading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-black text-gray-400 uppercase tracking-widest text-[10px]">
              {selectedCourseId === "" ? "Global Curriculum Roadmap" : "Course Content Roadmap"}
            </h3>
            <span className="text-[10px] font-black px-4 py-1.5 bg-indigo-600 text-white rounded-full uppercase tracking-widest">{lessons.length} Modules Total</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {lessons.length > 0 ? [...lessons].map((lesson) => {
              const isLocked = !isAdmin && !lesson.unlocked;
              const isCompleted = lesson.completed;
              const isActive = activeLesson?.id === lesson.id;

              return (
                <li 
                  key={lesson.id} 
                  className={`p-8 transition-all group ${isLocked ? 'bg-gray-50/50 cursor-not-allowed opacity-60' : 'hover:bg-gray-50/50 cursor-pointer'} ${isActive ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => !isLocked && setActiveLesson(lesson)}
                >
                  <div className="flex items-center gap-8">
                    <div className="flex-shrink-0">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black transition-all transform group-hover:scale-110 ${
                        isLocked ? "bg-gray-200 text-gray-400" : (isCompleted ? "bg-green-100 text-green-600 shadow-sm shadow-green-50" : (isActive ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50"))
                      }`}>
                        {isLocked ? <Lock size={20} /> : (isCompleted ? <CheckCircle2 size={24} /> : lesson.order)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <span className="w-4 h-[1.5px] bg-indigo-200"></span>
                        {lesson.course?.name}
                      </div>
                      <p className={`text-xl font-black truncate tracking-tight ${isLocked ? "text-gray-400" : (isActive ? "text-indigo-600" : "text-gray-900")}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-6 mt-2 text-xs text-gray-400 font-bold uppercase tracking-tighter">
                        <div className="flex items-center gap-2">
                          {isLocked ? <Lock size={14} /> : (lesson.videoType === "UPLOAD" ? <HardDrive size={14} /> : <LinkIcon size={14} />)}
                          <span>{isLocked ? "Prerequisite Locked" : (lesson.videoType === "UPLOAD" ? "Direct Stream" : "External Link")}</span>
                        </div>
                        {!isLocked && (
                          <div className="flex items-center gap-2">
                            <PlayCircle size={16} className={isActive ? "text-indigo-600" : "text-gray-300"} />
                            <span className={isActive ? "text-indigo-600" : ""}>{isCompleted ? "Watch Again" : (isActive ? "Currently Watching" : "Start Learning")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isAdmin ? (
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditInit(lesson); }}
                          className="p-3 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-gray-100 shadow-sm transition-all"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(lesson.id); }}
                          className="p-3 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-100 shadow-sm transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      isLocked && <div className="text-[10px] font-black text-gray-400 bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-widest border border-gray-200/50">Prerequisite Required</div>
                    )}
                  </div>
                </li>
              );
            }) : (
              <li className="p-24 text-center">
                 <div className="max-w-xs mx-auto">
                    <div className="bg-gray-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                         <Video className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">No Modules Published</h3>
                    <p className="text-gray-400 text-sm mt-2">There are no lessons available for your enrolled courses yet.</p>
                 </div>
              </li>
            )}
          </ul>
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

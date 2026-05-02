"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getLessonsByCourse, createLesson } from "@/redux/slice/lessonSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { markLessonComplete } from "@/redux/slice/progressSlice";
import Loader from "@/components/Loader";
import { Plus, Video, PlayCircle, Upload, Link as LinkIcon, FileVideo, HardDrive, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { UploadButton, UploadDropzone } from "@/lib/uploadthing";

export default function LessonsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { lessons, loading: lessonsLoading } = useSelector((state: RootState) => state.lesson);
  const { courses } = useSelector((state: RootState) => state.course);
  const { enrollments } = useSelector((state: RootState) => state.enrollment);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [showForm, setShowForm] = useState(false);
  const [videoSource, setVideoSource] = useState<"UPLOAD" | "URL">("URL");
  const [activeLesson, setActiveLesson] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    order: "",
  });

  useEffect(() => {
    if (isAdmin) {
      dispatch(getCourses());
    } else {
      dispatch(getUserEnrollments());
    }
    // Fetch all lessons initially
    dispatch(getLessonsByCourse(0)); // Passing 0 or undefined will trigger "Fetch All" in our new API logic
  }, [dispatch, isAdmin]);

  const availableCourses = isAdmin 
    ? courses 
    : enrollments
        .filter(e => e.status === "APPROVED")
        .map(e => ({ id: e.courseId, name: e.course?.name || "Unknown Course" }));

  useEffect(() => {
    if (selectedCourseId !== "") {
      dispatch(getLessonsByCourse(Number(selectedCourseId)));
    } else {
      dispatch(getLessonsByCourse(0));
    }
    setActiveLesson(null);
  }, [selectedCourseId, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.order || !selectedCourseId || !formData.videoUrl) {
      toast.error("All fields are required");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      order: parseInt(formData.order, 10),
      courseId: Number(selectedCourseId),
      videoType: videoSource,
      videoUrl: formData.videoUrl
    };

    const res = await dispatch(createLesson(payload));
    if (createLesson.fulfilled.match(res)) {
      setShowForm(false);
      setFormData({ title: "", videoUrl: "", order: "" });
      toast.success("Lesson successfully published!");
    }
  };

  const handleLessonComplete = async (lessonId: number) => {
    if (isAdmin) return;
    
    await dispatch(markLessonComplete({ 
      courseId: lessons.find(l => l.id === lessonId)?.courseId || 0, 
      lessonId 
    }));

    dispatch(getLessonsByCourse(selectedCourseId === "" ? 0 : Number(selectedCourseId)));
    toast.success("Lesson completed!");
  };

  const renderPlayer = (lesson: any) => {
    const handleEnded = () => handleLessonComplete(lesson.id);

    if (lesson.videoType === "URL") {
      const ytMatch = lesson.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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
            <div className="absolute bottom-4 right-4">
              <button 
                onClick={handleEnded}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Mark as Completed
              </button>
            </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
          <p className="text-gray-500 mt-1">Explore all your enrolled modules or filter by course.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value === "" ? "" : Number(e.target.value))}
            className="appearance-none block w-full sm:w-64 pl-4 pr-10 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl bg-white shadow-sm transition-all"
          >
            <option value="">View All Enrolled Courses</option>
            {availableCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {isAdmin && selectedCourseId !== "" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md text-sm font-bold whitespace-nowrap"
            >
              {showForm ? "Cancel" : <><Plus size={18} /> Add Lesson</>}
            </button>
          )}
        </div>
      </div>

      {activeLesson && (
        <div className="mb-12 animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-2 rounded-[2rem] shadow-2xl border border-gray-100">
            {renderPlayer(activeLesson)}
          </div>
          <div className="mt-6 px-4 flex justify-between items-start">
            <div>
              <div className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">
                {activeLesson.course?.name || "Course Module"}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{activeLesson.title}</h2>
              <div className="flex items-center gap-2 text-gray-500 mt-1 text-sm">
                <span className="font-semibold px-2 py-0.5 bg-gray-100 rounded-md">Lesson {activeLesson.order}</span>
                <span>&bull;</span>
                <span>{activeLesson.completed ? "Completed ✅" : "In Progress 🚀"}</span>
              </div>
            </div>
            {activeLesson.completed && (
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-200">
                <CheckCircle2 size={18} />
                Mastered
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Video className="text-indigo-600" />
            Curriculum Builder
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lesson Title</label>
                <input
                  type="text"
                  placeholder="e.g. 01. Getting Started"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
                <input
                  type="number"
                  placeholder="1"
                  value={formData.order}
                  onChange={e => setFormData({...formData, order: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Video Source</label>
              <div className="flex gap-4 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setVideoSource("URL")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    videoSource === "URL" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LinkIcon size={16} />
                  Video Link
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSource("UPLOAD")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    videoSource === "UPLOAD" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <HardDrive size={16} />
                  Upload Video
                </button>
              </div>
            </div>

            {videoSource === "URL" ? (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Paste Video URL</label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">Drag & Drop Large Video (up to 2GB)</label>
                {formData.videoUrl ? (
                  <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 p-2 rounded-lg"><PlayCircle className="text-white" size={20} /></div>
                      <div>
                        <p className="text-green-800 font-bold">Video Uploaded Successfully!</p>
                        <p className="text-green-600 text-xs truncate max-w-xs">{formData.videoUrl}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, videoUrl: ""})} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
                  </div>
                ) : (
                  <div className="bg-indigo-50/30 rounded-2xl p-2 border-2 border-dashed border-indigo-100">
                    <UploadDropzone
                      endpoint="videoUploader"
                      onClientUploadComplete={(res) => {
                        setFormData({ ...formData, videoUrl: res[0].url });
                        toast.success("Video ready!");
                      }}
                      onUploadError={(error: Error) => toast.error(`ERROR! ${error.message}`)}
                      className="ut-label:text-indigo-600 ut-button:bg-indigo-600"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg">
                Save to Curriculum
              </button>
            </div>
          </form>
        </div>
      )}

      {lessonsLoading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
              {selectedCourseId === "" ? "All Your Modules" : "Course Roadmap"}
            </h3>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-600 text-white rounded-full">{lessons.length} Lessons</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {lessons.length > 0 ? [...lessons].map((lesson) => {
              const isLocked = !isAdmin && !lesson.unlocked;
              const isCompleted = lesson.completed;
              const isActive = activeLesson?.id === lesson.id;

              return (
                <li 
                  key={lesson.id} 
                  className={`p-6 transition-all group ${isLocked ? 'bg-gray-50/50 cursor-not-allowed opacity-60' : 'hover:bg-gray-50 cursor-pointer'} ${isActive ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => !isLocked && setActiveLesson(lesson)}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold transition-all ${
                        isLocked ? "bg-gray-200 text-gray-400" : (isCompleted ? "bg-green-100 text-green-600" : (isActive ? "bg-indigo-600 text-white shadow-lg" : "bg-indigo-50 text-indigo-700"))
                      }`}>
                        {isLocked ? <Lock size={18} /> : (isCompleted ? <CheckCircle2 size={20} /> : lesson.order)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-indigo-500 font-bold uppercase tracking-tighter mb-0.5">
                        {lesson.course?.name}
                      </div>
                      <p className={`text-lg font-bold truncate ${isLocked ? "text-gray-400" : (isActive ? "text-indigo-600" : "text-gray-900")}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          {isLocked ? <Lock size={14} /> : (lesson.videoType === "UPLOAD" ? <HardDrive size={14} /> : <LinkIcon size={14} />)}
                          <span>{isLocked ? "Locked" : (lesson.videoType === "UPLOAD" ? "Direct HD" : "External")}</span>
                        </div>
                        {!isLocked && (
                          <div className="flex items-center gap-1.5">
                            <PlayCircle size={16} className={isActive ? "text-indigo-600" : "text-gray-300"} />
                            <span className={isActive ? "text-indigo-600 font-bold" : ""}>{isCompleted ? "Review Lesson" : (isActive ? "Watching..." : "Start Lesson")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isLocked && <div className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-tighter">Prerequisite Required</div>}
                  </div>
                </li>
              );
            }) : (
              <li className="p-16 text-center text-gray-400 italic">No modules found for your enrolled courses yet.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

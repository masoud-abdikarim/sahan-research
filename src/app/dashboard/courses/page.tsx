"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getCourses, createCourse, updateCourse, deleteCourse, Course } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import { Plus, Edit, Trash2, X, Check, Upload, Link as LinkIcon, Image as ImageIcon, Search, Filter, Video, FileVideo } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { UploadButton } from "@/lib/uploadthing";

export default function CoursesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, loading } = useSelector((state: RootState) => state.course);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = (currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN");

  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [videoInputMode, setVideoInputMode] = useState<"upload" | "url">("upload");
  const [previewVideoUploadProgress, setPreviewVideoUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    outcomes: [] as string[],
    instructor: "",
    price: "",
    durationMonths: "",
    whoIsFor: [] as string[],
    prerequisites: [] as string[],
    category: "",
    imageUrl: "",
    previewVideoType: "URL" as "UPLOAD" | "URL",
    previewVideoUrl: "",
  });

  const [outcomeInput, setOutcomeInput] = useState("");
  const [whoIsForInput, setWhoIsForInput] = useState("");
  const [prerequisiteInput, setPrerequisiteInput] = useState("");

  // Filtering State
  const [filterTerm, setFilterTerm] = useState("");

  // Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  const filteredCourses = useMemo(() => {
    if (!filterTerm.trim()) return courses;
    
    const term = filterTerm.toLowerCase();
    return courses.filter(course => {
      return (
        course.name.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term)
      );
    });
  }, [courses, filterTerm]);

  const handleEditInit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      outcomes: course.outcomes || [],
      instructor: course.instructor || "",
      price: course.price.toString(),
      durationMonths: course.durationMonths.toString(),
      whoIsFor: course.whoIsFor || [],
      prerequisites: course.prerequisites || [],
      category: course.category,
      imageUrl: course.imageUrl || "",
      previewVideoType: course.previewVideoType || "URL",
      previewVideoUrl: course.previewVideoUrl || "",
    });
    if (course.imageUrl) {
      setImageInputMode(course.imageUrl.startsWith("http") ? "url" : "upload");
    } else {
      setImageInputMode("upload");
    }
    if (course.previewVideoUrl) {
      setVideoInputMode(course.previewVideoType === "UPLOAD" ? "upload" : "url");
    } else {
      setVideoInputMode("upload");
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ name: "", description: "", outcomes: [], instructor: "", price: "", durationMonths: "", whoIsFor: [], prerequisites: [], category: "", imageUrl: "", previewVideoType: "URL", previewVideoUrl: "" });
    setOutcomeInput("");
    setWhoIsForInput("");
    setPrerequisiteInput("");
    setPreviewVideoUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price || !formData.durationMonths || !formData.category) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (videoInputMode === "upload" && previewVideoUploadProgress > 0 && previewVideoUploadProgress < 100) {
      toast.error("Please wait for the video upload to complete.");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      outcomes: formData.outcomes,
      instructor: formData.instructor,
      price: parseFloat(formData.price),
      durationMonths: parseInt(formData.durationMonths, 10),
      whoIsFor: formData.whoIsFor,
      prerequisites: formData.prerequisites,
      category: formData.category,
      imageUrl: formData.imageUrl,
      previewVideoType: formData.previewVideoUrl ? formData.previewVideoType : null,
      previewVideoUrl: formData.previewVideoUrl ? formData.previewVideoUrl.trim() : null,
    };

    if (editingCourse) {
      const res = await dispatch(updateCourse({ id: editingCourse.id, data: payload }));
      if (updateCourse.fulfilled.match(res)) handleCancel();
    } else {
      const res = await dispatch(createCourse(payload));
      if (createCourse.fulfilled.match(res)) handleCancel();
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteId) {
      const res = await dispatch(deleteCourse(confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 bg-white dark:bg-slate-950">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest">System Restricted</h2>
        <a href="/" className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Back to Portal</a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Course Management</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">Create, edit, and organize your academic curriculum.</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null);
            setFormData({
              name: "",
              description: "",
              outcomes: [],
              instructor: "",
              price: "",
              durationMonths: "",
              whoIsFor: [],
              prerequisites: [],
              category: "",
              imageUrl: "",
              previewVideoType: "URL",
              previewVideoUrl: "",
            });
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 uppercase tracking-widest text-xs"
        >
          <Plus size={18} />
          Create New Course
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search courses by name or category..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all font-bold text-gray-800 dark:text-slate-200"
          />
          {filterTerm && (
            <button 
              onClick={() => setFilterTerm("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mb-12 max-w-4xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-indigo-100/20 dark:shadow-black/20 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                {editingCourse ? <Edit size={20} /> : <Plus size={20} />}
              </div>
              {editingCourse ? "Edit Course" : "New Course"}
            </h2>
            <button onClick={handleCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Core Info Section */}
            <div className="bg-gray-50/50 dark:bg-slate-950/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                  <Check size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Academic Research"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Social Science"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Duration (Months)</label>
                    <input
                      type="number"
                      value={formData.durationMonths}
                      onChange={e => setFormData({...formData, durationMonths: e.target.value})}
                      className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Instructor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Ahmed Mohamed"
                    value={formData.instructor}
                    onChange={e => setFormData({...formData, instructor: e.target.value})}
                    className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Description & Media Section */}
            <div className="p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <LinkIcon size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Content & Media</h3>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Course Description</label>
                <textarea
                  rows={6}
                  placeholder="Provide a detailed overview of the course content and objectives..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 transition-all outline-none font-medium text-gray-700 dark:text-slate-200 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Banner Image</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-950 rounded-xl w-fit border border-gray-200 dark:border-slate-800">
                      <button type="button" onClick={() => setImageInputMode("upload")} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${imageInputMode === "upload" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-gray-500"}`}>Upload</button>
                      <button type="button" onClick={() => setImageInputMode("url")} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${imageInputMode === "url" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-gray-500"}`}>Link</button>
                    </div>
                    {imageInputMode === "upload" ? (
                      <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2rem] p-12 text-center bg-gray-50/30">
                        <UploadButton
                          endpoint="courseImageUploader"
                          onClientUploadComplete={(res) => { if (res?.[0]) setFormData({ ...formData, imageUrl: res[0].url }); toast.success("Image uploaded!"); }}
                          onUploadError={(error: Error) => { toast.error(`Upload failed: ${error.message}`); }}
                          appearance={{ button: "bg-indigo-600 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all" }}
                        />
                      </div>
                    ) : (
                      <input type="text" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 outline-none" />
                    )}
                  </div>
                  <div className="aspect-video md:aspect-square rounded-[2rem] overflow-hidden border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center justify-center relative group">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-200 dark:text-slate-800" size={48} />
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Course Preview Video */}
              <div className="space-y-4 pt-8 border-t border-gray-100 dark:border-slate-800">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Course Preview Video (Optional)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-950 rounded-xl w-fit border border-gray-200 dark:border-slate-800">
                      <button type="button" onClick={() => setVideoInputMode("upload")} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${videoInputMode === "upload" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-gray-500"}`}>Upload</button>
                      <button type="button" onClick={() => setVideoInputMode("url")} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${videoInputMode === "url" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" : "text-gray-500"}`}>Link</button>
                    </div>
                    {videoInputMode === "upload" ? (
                      <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2rem] p-12 text-center bg-gray-50/30">
                        {previewVideoUploadProgress > 0 && previewVideoUploadProgress < 100 ? (
                          <div className="space-y-2">
                            <div className="text-xs font-black text-indigo-600 uppercase tracking-widest">Uploading Video... {previewVideoUploadProgress}%</div>
                            <div className="w-full bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full transition-all" style={{ width: `${previewVideoUploadProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <UploadButton
                            endpoint="videoUploader"
                            onUploadBegin={() => { setPreviewVideoUploadProgress(1); }}
                            onUploadProgress={(progress) => { setPreviewVideoUploadProgress(progress); }}
                            onClientUploadComplete={(res) => { if (res?.[0]) setFormData({ ...formData, previewVideoUrl: res[0].url, previewVideoType: "UPLOAD" }); setPreviewVideoUploadProgress(100); toast.success("Video uploaded!"); }}
                            onUploadError={(error: Error) => { setPreviewVideoUploadProgress(0); toast.error(`Upload failed: ${error.message}`); }}
                            appearance={{ button: "bg-indigo-600 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all" }}
                          />
                        )}
                        {formData.previewVideoUrl && formData.previewVideoType === "UPLOAD" && (
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Uploaded Successfully!</span>
                            <button type="button" onClick={() => { setFormData({ ...formData, previewVideoUrl: "", previewVideoType: "URL" }); setPreviewVideoUploadProgress(0); }} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input type="text" placeholder="https://youtube.com/... or https://vimeo.com/... or direct link" value={formData.previewVideoUrl} onChange={e => setFormData({...formData, previewVideoUrl: e.target.value, previewVideoType: "URL"})} className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 outline-none text-sm font-bold text-gray-800 dark:text-slate-200" />
                        <p className="text-[10px] font-bold text-gray-400">Supports YouTube, Vimeo, or direct video file links.</p>
                      </div>
                    )}
                  </div>
                  <div className="aspect-video md:aspect-square rounded-[2rem] overflow-hidden border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center relative group p-2">
                    {formData.previewVideoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <FileVideo className="text-indigo-600 dark:text-indigo-400" size={48} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 text-center line-clamp-2 max-w-[150px] break-all">{formData.previewVideoUrl}</span>
                        <button type="button" onClick={() => setFormData({ ...formData, previewVideoUrl: "", previewVideoType: "URL" })} className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline">Remove Video</button>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 text-gray-400 dark:text-slate-600">
                        <Video size={48} className="mx-auto" />
                        <span className="text-[10px] font-black uppercase tracking-widest block">No Video Added</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Lists Section */}
            <div className="p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-12">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <Filter size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Curriculum Details</h3>
              </div>

              {/* Outcomes */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">What Students Will Learn</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add an outcome..." value={outcomeInput} onChange={e => setOutcomeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), outcomeInput.trim() && (setFormData({...formData, outcomes: [...formData.outcomes, outcomeInput.trim()]}), setOutcomeInput("")))} className="flex-1 px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 outline-none" />
                  <button type="button" onClick={() => outcomeInput.trim() && (setFormData({...formData, outcomes: [...formData.outcomes, outcomeInput.trim()]}), setOutcomeInput(""))} className="px-6 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.outcomes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800 font-bold text-xs">{item} <X size={14} className="cursor-pointer" onClick={() => setFormData({...formData, outcomes: formData.outcomes.filter((_, i) => i !== idx)})} /></div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Requirements / Prerequisites</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add a requirement..." value={prerequisiteInput} onChange={e => setPrerequisiteInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), prerequisiteInput.trim() && (setFormData({...formData, prerequisites: [...formData.prerequisites, prerequisiteInput.trim()]}), setPrerequisiteInput("")))} className="flex-1 px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 outline-none" />
                  <button type="button" onClick={() => prerequisiteInput.trim() && (setFormData({...formData, prerequisites: [...formData.prerequisites, prerequisiteInput.trim()]}), setPrerequisiteInput(""))} className="px-6 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.prerequisites.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800 font-bold text-xs">{item} <X size={14} className="cursor-pointer" onClick={() => setFormData({...formData, prerequisites: formData.prerequisites.filter((_, i) => i !== idx)})} /></div>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Who This Course Is For</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add a target audience..." value={whoIsForInput} onChange={e => setWhoIsForInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), whoIsForInput.trim() && (setFormData({...formData, whoIsFor: [...formData.whoIsFor, whoIsForInput.trim()]}), setWhoIsForInput("")))} className="flex-1 px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 outline-none" />
                  <button type="button" onClick={() => whoIsForInput.trim() && (setFormData({...formData, whoIsFor: [...formData.whoIsFor, whoIsForInput.trim()]}), setWhoIsForInput(""))} className="px-6 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.whoIsFor.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-800 font-bold text-xs">{item} <X size={14} className="cursor-pointer" onClick={() => setFormData({...formData, whoIsFor: formData.whoIsFor.filter((_, i) => i !== idx)})} /></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-12">
              <button type="button" onClick={handleCancel} className="px-8 py-4 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">Discard Changes</button>
              <button type="submit" disabled={loading} className="flex items-center gap-3 bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 dark:shadow-none uppercase tracking-widest text-xs disabled:opacity-50">
                <Check size={20} />
                {editingCourse ? "Update Course" : "Publish Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Course Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Price</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Duration</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-950/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {course.imageUrl && (
                        <img 
                          src={course.imageUrl} 
                          alt="" 
                          className="w-14 h-14 rounded-2xl object-cover border border-gray-100 dark:border-slate-800 shadow-sm"
                        />
                      )}
                      <div>
                        <div className="text-lg font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-1 line-clamp-1 max-w-lg uppercase tracking-tighter">{course.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 dark:border-indigo-900/30">
                      {course.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-lg font-black text-gray-900 dark:text-white">${course.price.toFixed(2)}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{course.durationMonths} Months</div>
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditInit(course)}
                        className="p-3 bg-white dark:bg-slate-900 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
                        title="Edit Course"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(course.id)}
                        className="p-3 bg-white dark:bg-slate-900 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
                        title="Delete Course"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-slate-950 flex items-center justify-center text-gray-200 dark:text-slate-800">
                        <Search size={40} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">No matching courses</p>
                        <p className="text-gray-500 dark:text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
                      </div>
                      <button 
                        onClick={() => { setFilterTerm(""); }}
                        className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] hover:underline mt-2"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Delete Course?"
        message="This will permanently remove the course and all associated lessons, enrollments, and student progress. This action cannot be undone."
        confirmText="Delete Course"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
        loading={loading}
      />
    </div>
  );
}

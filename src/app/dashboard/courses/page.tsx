"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getCourses, createCourse, updateCourse, deleteCourse, Course } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import { Plus, Edit, Trash2, X, Check, Upload, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { UploadButton } from "@/lib/uploadthing";

export default function CoursesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, loading } = useSelector((state: RootState) => state.course);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationMonths: "",
    category: "",
    imageUrl: "",
  });

  // Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  const handleEditInit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      price: course.price.toString(),
      durationMonths: course.durationMonths.toString(),
      category: course.category,
      imageUrl: course.imageUrl || "",
    });
    if (course.imageUrl) {
      setImageInputMode(course.imageUrl.startsWith("http") ? "url" : "upload");
    } else {
      setImageInputMode("upload");
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCourse(null);
    setFormData({ name: "", description: "", price: "", durationMonths: "", category: "", imageUrl: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price || !formData.durationMonths || !formData.category) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      durationMonths: parseInt(formData.durationMonths, 10),
      category: formData.category,
      imageUrl: formData.imageUrl
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
            setFormData({ name: "", description: "", price: "", durationMonths: "", category: "", imageUrl: "" });
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-4 rounded-[2rem] font-black hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 uppercase tracking-widest text-xs"
        >
          <Plus size={18} />
          Create New Course
        </button>
      </div>

      {showForm && (
        <div className="mb-12 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-2xl shadow-indigo-100/20 dark:shadow-black/20 animate-in fade-in slide-in-from-top-4 duration-500">
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master React & Next.js"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Development"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
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
                    className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Duration (Mo)</label>
                  <input
                    type="number"
                    value={formData.durationMonths}
                    onChange={e => setFormData({...formData, durationMonths: e.target.value})}
                    className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe what students will learn..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-medium text-gray-700 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Course Image (Optional)</label>
                
                <div className="flex gap-4 p-1 bg-gray-100 dark:bg-slate-950 rounded-2xl w-fit border border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setImageInputMode("upload")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                      imageInputMode === "upload" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Upload size={12} />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode("url")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                      imageInputMode === "url" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <LinkIcon size={12} />
                    URL
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                  <div className="md:col-span-2">
                    {imageInputMode === "upload" ? (
                      <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2rem] p-10 text-center hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors bg-gray-50/50 dark:bg-slate-950/50">
                        <UploadButton
                          endpoint="courseImageUploader"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                              setFormData({ ...formData, imageUrl: res[0].url });
                              toast.success("Image uploaded!");
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
                    ) : (
                      <input
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        className="w-full px-6 py-4 border border-gray-100 dark:border-slate-800 rounded-2xl bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none font-bold text-gray-800 dark:text-slate-200"
                      />
                    )}
                  </div>

                  {/* Preview Card */}
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-inner bg-gray-50 dark:bg-slate-950 flex items-center justify-center group">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, imageUrl: ""})}
                          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="mx-auto text-gray-200 dark:text-slate-800 mb-3" size={48} />
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-600 uppercase tracking-widest">Image Preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-50 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-4 rounded-2xl text-xs font-black text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-all uppercase tracking-widest"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black hover:bg-black dark:hover:bg-slate-100 transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                <Check size={18} />
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
              {courses.map((course) => (
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
              {courses.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-400 dark:text-slate-600 font-bold uppercase tracking-[0.2em]">
                    No courses found in curriculum.
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
      />
    </div>
  );
}

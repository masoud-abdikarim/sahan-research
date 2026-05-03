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
    // Default to URL mode if there's an existing image that looks like a URL
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
      if (deleteCourse.rejected.match(res)) {
        // Error toast is already handled in thunk, but we ensure consistency here if needed
      }
      setConfirmDeleteId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Students browse courses on the Landing Page</h2>
        <a href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Go to Course Catalog</a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-500 mt-1">Create and manage your educational content.</p>
        </div>
        <button
          onClick={() => (showForm ? handleCancel() : setShowForm(true))}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-md text-sm font-bold ${
            showForm ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "Add New Course"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-indigo-600 rounded-lg"><Plus className="text-white" size={20} /></div>
            <h2 className="text-2xl font-black text-gray-900">{editingCourse ? "Edit Course Details" : "Publish New Course"}</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Course Title</label>
              <input
                type="text"
                placeholder="e.g. Master React & Next.js"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none text-lg font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
              <input
                type="text"
                placeholder="e.g. Development"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800"
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Course Image (Optional)</label>
              
              <div className="flex gap-4 p-1 bg-gray-100 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setImageInputMode("upload")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    imageInputMode === "upload" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Upload size={14} />
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode("url")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    imageInputMode === "url" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LinkIcon size={14} />
                  Image URL
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                  {imageInputMode === "upload" ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 transition-colors bg-gray-50/50">
                      <UploadButton
                        endpoint="courseImageUploader"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) {
                            setFormData({ ...formData, imageUrl: res[0].url });
                            toast.success("Image uploaded successfully!");
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Upload failed: ${error.message}`);
                        }}
                        appearance={{
                          button: "bg-indigo-600 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all after:bg-indigo-700",
                          allowedContent: "text-xs text-gray-400 font-medium mt-2"
                        }}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800"
                    />
                  )}
                </div>

                {/* Preview Card */}
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 flex items-center justify-center group">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ""})}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Duration (Mo)</label>
                <input
                  type="number"
                  value={formData.durationMonths}
                  onChange={e => setFormData({...formData, durationMonths: e.target.value})}
                  className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-bold text-gray-800"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
              <textarea
                rows={4}
                placeholder="Describe what students will learn..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-medium text-gray-700"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t border-gray-50">
               <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3.5 text-gray-500 font-bold hover:text-gray-700"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-12 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? "Processing..." : (editingCourse ? "Update Course" : "Publish Course")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/30">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Course Curriculum</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Tuition</th>
                <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Management</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {course.imageUrl && (
                        <img 
                          src={course.imageUrl} 
                          alt="" 
                          className="w-12 h-12 rounded-lg object-cover border border-gray-100 shadow-sm"
                        />
                      )}
                      <div>
                        <div className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{course.name}</div>
                        <div className="text-xs text-gray-400 font-medium mt-1 line-clamp-1 max-w-lg">{course.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                      {course.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-sm font-black text-gray-900">${course.price.toFixed(2)}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{course.durationMonths} Months Duration</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleEditInit(course)}
                        className="p-3 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl border border-gray-100 shadow-sm transition-all" title="Edit Course"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(course.id)}
                        className="p-3 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl border border-gray-100 shadow-sm transition-all" title="Delete Course"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="max-w-xs mx-auto">
                        <div className="bg-indigo-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                             <Plus className="text-indigo-400" size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">Your Catalog is Empty</h3>
                        <p className="text-gray-400 text-sm mt-2">Start your journey by publishing your very first course today!</p>
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
      />
    </div>
  );
}

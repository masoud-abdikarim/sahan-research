"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getLessonsByCourse, createLesson } from "@/redux/slice/lessonSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import { Plus, Video, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function LessonsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { lessons, loading: lessonsLoading } = useSelector((state: RootState) => state.lesson);
  const { courses, loading: coursesLoading } = useSelector((state: RootState) => state.course);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    order: "",
  });

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCourseId !== "") {
      dispatch(getLessonsByCourse(Number(selectedCourseId)));
    }
  }, [selectedCourseId, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.videoUrl || !formData.order || selectedCourseId === "") {
      toast.error("All fields are required");
      return;
    }

    const res = await dispatch(createLesson({
      title: formData.title,
      videoUrl: formData.videoUrl,
      order: parseInt(formData.order, 10),
      courseId: Number(selectedCourseId)
    }));

    if (createLesson.fulfilled.match(res)) {
      setShowForm(false);
      setFormData({ title: "", videoUrl: "", order: "" });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value === "" ? "" : Number(e.target.value))}
            className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
          >
            <option value="">Select a Course...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {isAdmin && selectedCourseId !== "" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
            >
              <Plus size={18} />
              Add Lesson
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Lesson</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order / Sequence</label>
              <input
                type="number"
                value={formData.order}
                onChange={e => setFormData({...formData, order: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={lessonsLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {lessonsLoading ? "Saving..." : "Save Lesson"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedCourseId === "" ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
          <Video className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No course selected</h3>
          <p className="mt-1 text-sm text-gray-500">Please select a course from the dropdown to view its lessons.</p>
        </div>
      ) : lessonsLoading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {lessons.length > 0 ? [...lessons].sort((a,b) => a.order - b.order).map((lesson) => (
              <li key={lesson.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                      {lesson.order}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {lesson.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                      <PlayCircle size={14} />
                      <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
                        Watch Video
                      </a>
                    </p>
                  </div>
                </div>
              </li>
            )) : (
              <li className="p-8 text-center text-gray-500">No lessons found for this course.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

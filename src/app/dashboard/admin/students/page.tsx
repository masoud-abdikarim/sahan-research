"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";
import { 
  Search, 
  User, 
  BookOpen, 
  GraduationCap, 
  FileQuestion, 
  ChevronRight, 
  Filter, 
  ChevronLeft, 
  Calendar,
  Edit,
  Trash2,
  X,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

type StudentData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  enrollmentId: number | null;
  courseId: number | null;
  courseName: string;
  moduleCount: number;
  completedModules: number;
  finalExamMark: string;
  totalMarks: string;
  progressPercentage: number;
  graduationStatus: string;
  certificateStatus: string;
  enrollmentYear: string | null;
  graduationDate: string | null;
};

export default function ManageStudentsPage() {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [allCourses, setAllCourses] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [certFilter, setCertFilter] = useState("ALL");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    academicStatus: "PRESENT",
    courseId: ""
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<StudentData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("/api/admin/students");
      setStudents(res.data.students || []);
    } catch (error: any) {
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/courses");
        setAllCourses(res.data.courses || []);
      } catch (err) {
        console.error("Failed to load courses");
      }
    };

    fetchStudents();
    fetchCourses();
  }, []);

  // Compute unique values for filters
  const uniqueCourses = useMemo(() => Array.from(new Set(students.map(s => s.courseName).filter(c => c !== "No Course"))), [students]);
  const uniqueYears = useMemo(() => Array.from(new Set(students.map(s => s.enrollmentYear).filter(Boolean) as string[])), [students]);

  // Apply Filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone && s.phone.includes(searchQuery));
      
      const matchesCourse = courseFilter === "ALL" || s.courseName === courseFilter;
      const matchesStatus = statusFilter === "ALL" || s.graduationStatus === statusFilter;
      const matchesYear = yearFilter === "ALL" || s.enrollmentYear === yearFilter;
      const matchesCert = certFilter === "ALL" || s.certificateStatus === certFilter;

      return matchesSearch && matchesCourse && matchesStatus && matchesYear && matchesCert;
    });
  }, [students, searchQuery, courseFilter, statusFilter, yearFilter, certFilter]);

  // Pagination Math
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, courseFilter, statusFilter, yearFilter, certFilter]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "GRADUATED": return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">GRADUATED</span>;
      case "CERTIFIED": return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">CERTIFIED</span>;
      case "FAILED": return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">FAILED</span>;
      case "PRESENT": return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">PRESENT</span>;
      default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400">{status}</span>;
    }
  };

  const handleOpenEdit = (student: StudentData) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      password: "",
      academicStatus: student.graduationStatus === "GRADUATED" || student.graduationStatus === "CERTIFIED" ? "GRADUATED" : "PRESENT",
      courseId: student.courseId ? String(student.courseId) : ""
    });
    setIsEditOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }
    
    setEditLoading(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        password: editForm.password ? editForm.password : undefined,
        academicStatus: editForm.academicStatus,
        courseId: editForm.courseId ? Number(editForm.courseId) : null
      };

      await axios.put(`/api/admin/students/${editingStudent.id}`, payload);
      toast.success("Student updated successfully");
      setIsEditOpen(false);
      
      // Refresh list
      const res = await axios.get("/api/admin/students");
      setStudents(res.data.students || []);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to update student";
      toast.error(errMsg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = (student: StudentData) => {
    setDeletingStudent(student);
    setIsDeleteOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/admin/students/${deletingStudent.id}`);
      toast.success("Student successfully deleted");
      setIsDeleteOpen(false);
      
      // Refresh list
      const res = await axios.get("/api/admin/students");
      setStudents(res.data.students || []);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to delete student";
      toast.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Manage Students</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Academic student management and tracking system.</p>
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-indigo-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">Advanced Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <select 
            value={courseFilter} 
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          >
            <option value="ALL">All Courses</option>
            {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present (Studying)</option>
            <option value="GRADUATED">Graduated</option>
            <option value="FAILED">Failed</option>
            <option value="CERTIFIED">Certified</option>
          </select>

          <select 
            value={certFilter} 
            onChange={(e) => setCertFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          >
            <option value="ALL">All Cert States</option>
            <option value="No Request">No Request</option>
            <option value="PENDING">Pending</option>
            <option value="ISSUED">Issued / Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ELIGIBLE">Eligible (Not Requested)</option>
            <option value="LOCKED">Locked</option>
          </select>

          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          >
            <option value="ALL">All Years</option>
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Student</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Course</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Academic Status</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No students match your filters.</td>
              </tr>
            ) : (
              paginatedStudents.map((s, idx) => (
                <tr key={`${s.id}-${s.enrollmentId || idx}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                        {s.avatar ? <img src={s.avatar} alt="avatar" className="w-full h-full object-cover"/> : <User size={18}/>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-snug">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200 leading-snug">{s.courseName}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{s.enrollmentYear ? `Enrolled ${s.enrollmentYear}` : ""}</p>
                  </td>
                  <td className="p-5">
                    {getStatusBadge(s.graduationStatus)}
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link 
                        href={s.enrollmentId ? `/dashboard/admin/students/${s.id}?enrollmentId=${s.enrollmentId}` : `#`}
                        className={`inline-flex items-center justify-center bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 h-8 px-3 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all ${!s.enrollmentId && "opacity-50 cursor-not-allowed pointer-events-none"}`}
                      >
                        Details <ChevronRight size={14} className="ml-0.5" />
                      </Link>

                      {currentUser?.role === "SUPERADMIN" && (
                        <>
                          <button 
                            onClick={() => handleOpenEdit(s)}
                            className="inline-flex items-center justify-center bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 h-8 px-3 rounded-lg text-xs font-bold hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition-all"
                          >
                            <Edit size={14} className="mr-1" /> Edit
                          </button>

                          <button 
                            onClick={() => handleOpenDelete(s)}
                            className="inline-flex items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 h-8 px-3 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-all"
                          >
                            <Trash2 size={14} className="mr-1" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{filteredStudents.length}</span> students
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold px-4">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Student</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Update student details and enrollment status.</p>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateStudent}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Student Name */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                    placeholder="name@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                  <input 
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                    placeholder="e.g. +252..."
                  />
                </div>

                {/* Password (Editable) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                    New Password <span className="text-gray-400 dark:text-slate-500 font-normal lowercase">(leave blank to keep current)</span>
                  </label>
                  <input 
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>

                {/* Course Enrollment */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">Enrolled Course</label>
                  <select
                    value={editForm.courseId}
                    onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  >
                    <option value="">No Course (Not Enrolled)</option>
                    {allCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Academic Status */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">Academic Status</label>
                  <select
                    value={editForm.academicStatus}
                    onChange={(e) => setEditForm({ ...editForm, academicStatus: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  >
                    <option value="PRESENT">PRESENT (In Progress / Studying)</option>
                    <option value="GRADUATED">GRADUATED (Completed)</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
                >
                  {editLoading && <Loader2 size={16} className="animate-spin" />}
                  {editLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteOpen && deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Warning Body */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4 border border-red-200 dark:border-red-500/20">
                <Trash2 size={28} />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Student Account?</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete <span className="font-extrabold text-gray-900 dark:text-white">{deletingStudent.name}</span>? This action is permanent and will completely remove their progress, enrollments, and certs from the system.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  className="w-full sm:w-auto min-w-[120px] px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-gray-200 dark:border-slate-700 sm:border-0"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteStudent}
                  className="w-full sm:w-auto min-w-[120px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-600/10"
                >
                  {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                  {deleteLoading ? "Deleting..." : "Yes, Delete Student"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

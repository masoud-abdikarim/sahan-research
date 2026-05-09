"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";
import { Search, User, BookOpen, GraduationCap, FileQuestion, ChevronRight, Filter, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";

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
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [certFilter, setCertFilter] = useState("ALL");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
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
    fetchStudents();
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
        s.phone.includes(searchQuery);
      
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

  const getCertBadge = (status: string) => {
    if (status === "ISSUED" || status === "APPROVED") return <span className="text-emerald-600 dark:text-emerald-400 font-bold">{status}</span>;
    if (status === "PENDING") return <span className="text-amber-600 dark:text-amber-400 font-bold">{status}</span>;
    if (status === "REJECTED") return <span className="text-red-600 dark:text-red-400 font-bold">{status}</span>;
    return <span className="text-gray-400 font-medium">{status}</span>;
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
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Student</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Course</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-center">Marks</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Academic Status</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Cert Status</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Graduation</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">No students match your filters.</td>
              </tr>
            ) : (
              paginatedStudents.map((s, idx) => (
                <tr key={`${s.id}-${s.enrollmentId || idx}`} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden border border-indigo-200 dark:border-indigo-800">
                        {s.avatar ? <img src={s.avatar} alt="avatar" className="w-full h-full object-cover"/> : <User size={18}/>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{s.courseName}</p>
                    <p className="text-xs text-gray-400">{s.enrollmentYear ? `Enrolled ${s.enrollmentYear}` : ""}</p>
                  </td>
                  <td className="p-5 text-center">
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{s.totalMarks}</p>
                  </td>
                  <td className="p-5">
                    {getStatusBadge(s.graduationStatus)}
                  </td>
                  <td className="p-5 text-sm">
                    {getCertBadge(s.certificateStatus)}
                  </td>
                  <td className="p-5">
                    {s.graduationDate ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <Calendar size={14} />
                        {s.graduationDate}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">-</span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <Link 
                      href={s.enrollmentId ? `/dashboard/admin/students/${s.id}?enrollmentId=${s.enrollmentId}` : `#`}
                      className={`inline-flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all ${!s.enrollmentId && "opacity-50 cursor-not-allowed pointer-events-none"}`}
                    >
                      Details <ChevronRight size={14} className="ml-1" />
                    </Link>
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
    </div>
  );
}

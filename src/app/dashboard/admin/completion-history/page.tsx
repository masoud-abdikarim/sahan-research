"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import { 
  Trophy, 
  Search, 
  Calendar, 
  Users, 
  ChevronRight, 
  ArrowLeft, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Filter,
  BookOpen
} from "lucide-react";
import toast from "react-hot-toast";

interface StudentCompletion {
  studentId: number;
  name: string;
  email: string;
  phone: string;
  completionDate: string;
  progressStatus: number;
}

interface CourseCompletion {
  courseId: number;
  courseName: string;
  durationMonths: number;
  totalCompleted: number;
  lastUpdated: string | null;
  students: StudentCompletion[];
}

export default function CompletionHistoryPage() {
  const [data, setData] = useState<CourseCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseCompletion | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/admin/completion-history");
      setData(res.data.completionData);
    } catch (err) {
      toast.error("Failed to load completion history");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!selectedCourse) return [];
    
    return selectedCourse.students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm);
      
      const studentYear = new Date(student.completionDate).getFullYear().toString();
      const matchesYear = yearFilter === "All" || studentYear === yearFilter;
      
      return matchesSearch && matchesYear;
    });
  }, [selectedCourse, searchTerm, yearFilter]);

  const years = useMemo(() => {
    const allDates = data.flatMap(c => c.students.map(s => new Date(s.completionDate).getFullYear()));
    const uniqueYears = Array.from(new Set(allDates)).sort((a, b) => b - a);
    return ["All", ...uniqueYears.map(String)];
  }, [data]);

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-500">
      {!selectedCourse ? (
        <>
          {/* ── OVERVIEW VIEW ── */}
          <div className="mb-12">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Course Completion History</h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">Track students who have completed each course successfully</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.map((course) => (
              <div key={course.courseId} className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                  <Trophy size={24} />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {course.courseName}
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Total Graduates</span>
                    <span className="text-gray-900 dark:text-white font-black">{course.totalCompleted} Students</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Last Completion</span>
                    <span className="text-gray-900 dark:text-white font-black">
                      {course.lastUpdated ? new Date(course.lastUpdated).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedCourse(course)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 text-gray-700 dark:text-slate-200 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-gray-100 dark:border-slate-700 group/btn"
                >
                  View Students
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* ── DETAIL VIEW ── */}
          <button 
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-black text-xs uppercase tracking-widest mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Overview
          </button>

          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-xl mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{selectedCourse.courseName}</h2>
                <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 px-3 py-1 rounded-full"><Users size={12}/> {selectedCourse.totalCompleted} Graduates</span>
                  <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 px-3 py-1 rounded-full"><Calendar size={12}/> {selectedCourse.durationMonths} Months Program</span>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-6 py-3 rounded-2xl border border-green-100 dark:border-green-900/30 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={18} /> Verified Completions
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-slate-950 rounded-3xl border border-gray-100 dark:border-slate-800">
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm appearance-none"
                >
                  {years.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Student Information</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Contact Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Completion Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">{student.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Student ID: #{student.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600 dark:text-slate-300 flex items-center gap-2"><Mail size={12}/> {student.email}</p>
                          <p className="text-xs font-medium text-gray-600 dark:text-slate-300 flex items-center gap-2"><Phone size={12}/> {student.phone}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-700 dark:text-slate-200">
                          {new Date(student.completionDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                          <CheckCircle2 size={12}/> 100% Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Search size={40} className="text-gray-200 dark:text-slate-800" />
                          <p className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">No matching student records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

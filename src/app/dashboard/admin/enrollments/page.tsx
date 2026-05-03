"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getAllEnrollments, approveEnrollment } from "@/redux/slice/enrollmentSlice";
import Loader from "@/components/Loader";
import { CheckCircle, XCircle, Phone, Calendar } from "lucide-react";

export default function AdminEnrollmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading } = useSelector((state: RootState) => state.enrollment);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

  useEffect(() => {
    dispatch(getAllEnrollments());
  }, [dispatch]);

  const filteredEnrollments = enrollments.filter(e => e.status === activeTab);

  const handleAction = (id: number, status: "APPROVED" | "REJECTED") => {
    dispatch(approveEnrollment({ id, status }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Manage Enrollments</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Review and approve student enrollment requests.</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-slate-800 mb-8 overflow-x-auto">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap uppercase tracking-widest ${
              activeTab === tab
                ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-700"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === tab ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
            }`}>
              {enrollments.filter(e => e.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Contact Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Course</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Requested At</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                {filteredEnrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900 dark:text-slate-100">{enrollment.user?.name}</div>
                      <div className="text-xs font-medium text-gray-400 dark:text-slate-500">{enrollment.user?.email}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                        <Phone size={14} className="text-indigo-500 dark:text-indigo-400" />
                        {enrollment.user?.phone || "No phone"}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-slate-100 font-black">{enrollment.course?.name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">ID: #{enrollment.courseId}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400">
                        <Calendar size={14} className="text-indigo-500 dark:text-indigo-400" />
                        {formatDate(enrollment.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      {activeTab === "PENDING" ? (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleAction(enrollment.id, "APPROVED")}
                            className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-all flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest border border-green-100 dark:border-green-900/30 shadow-sm"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(enrollment.id, "REJECTED")}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest border border-red-100 dark:border-red-900/30 shadow-sm"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          activeTab === "APPROVED" 
                            ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400" 
                            : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400"
                        }`}>
                          {activeTab === "APPROVED" ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                          {activeTab}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredEnrollments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 dark:text-slate-600 italic font-medium">
                      No {activeTab.toLowerCase()} enrollment requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

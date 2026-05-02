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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Enrollments</h1>
        <p className="text-gray-500 mt-1">Review and approve student enrollment requests.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
            }`}>
              {enrollments.filter(e => e.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Requested At</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEnrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{enrollment.user?.name}</div>
                      <div className="text-xs text-gray-400">{enrollment.user?.email}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-400" />
                        {enrollment.user?.phone || "No phone"}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">{enrollment.course?.name}</div>
                      <div className="text-xs text-gray-400 font-medium">ID: #{enrollment.courseId}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(enrollment.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      {activeTab === "PENDING" ? (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleAction(enrollment.id, "APPROVED")}
                            className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all flex items-center gap-1 font-bold border border-green-100"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(enrollment.id, "REJECTED")}
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all flex items-center gap-1 font-bold border border-red-100"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          activeTab === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 italic">
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

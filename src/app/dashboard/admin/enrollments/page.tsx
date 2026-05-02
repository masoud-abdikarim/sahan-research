"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getAllEnrollments, approveEnrollment } from "@/redux/slice/enrollmentSlice";
import Loader from "@/components/Loader";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Enrollments</h1>
          <p className="text-gray-500 mt-1">Review and approve student enrollment requests.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-8">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{enrollment.user?.name}</div>
                      <div className="text-xs text-gray-500">{enrollment.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{enrollment.course?.name}</div>
                      <div className="text-xs text-gray-500">ID: #{enrollment.courseId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {activeTab === "PENDING" ? (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleAction(enrollment.id, "APPROVED")}
                            className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(enrollment.id, "REJECTED")}
                            className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activeTab === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {activeTab === "APPROVED" ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                          {activeTab.toLowerCase()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredEnrollments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No {activeTab.toLowerCase()} enrollments found.
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

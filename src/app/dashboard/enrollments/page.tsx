"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getUserEnrollments, enrollCourse, approveEnrollment } from "@/redux/slice/enrollmentSlice";
import { getCourses } from "@/redux/slice/courseSlice";
import Loader from "@/components/Loader";
import CourseCard from "@/components/CourseCard";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function EnrollmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading: enrollLoading } = useSelector((state: RootState) => state.enrollment);
  const { courses, loading: coursesLoading } = useSelector((state: RootState) => state.course);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    dispatch(getCourses());
    if (currentUser) {
      dispatch(getUserEnrollments());
    }
  }, [dispatch, currentUser]);

  const handleEnroll = (courseId: number) => {
    if (currentUser) {
      dispatch(enrollCourse(courseId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "APPROVED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12}/> Approved</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12}/> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12}/> Pending</span>;
    }
  };

  const approvedEnrollments = enrollments.filter(e => e.status === "APPROVED");
  const pendingOrRejected = enrollments.filter(e => e.status !== "APPROVED");
  const unrolledCourses = courses.filter(c => !enrollments.some(e => e.courseId === c.id));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
        {isAdmin && (
          <a href="/dashboard/admin/enrollments" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Go to Admin Management &rarr;
          </a>
        )}
      </div>

      {/* ACTIVE COURSES */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Courses</h2>
        {enrollLoading ? <Loader /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              if (!course) return null;
              return (
                <CourseCard 
                  key={enrollment.id} 
                  course={course} 
                  actionLabel="Go to Lessons"
                  onAction={() => window.location.href = `/dashboard/lessons`} 
                />
              );
            })}
            {approvedEnrollments.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">You don't have any active courses yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* ENROLLMENT REQUESTS */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Requests</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingOrRejected.map((enrollment) => {
                  const course = courses.find(c => c.id === enrollment.courseId);
                  return (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{course?.name || `Course #${enrollment.courseId}`}</td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(enrollment.status)}</td>
                    </tr>
                  );
                })}
                {pendingOrRejected.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No pending requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AVAILABLE COURSES */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Explore More</h2>
          <div className="space-y-4">
            {unrolledCourses.slice(0, 3).map(course => (
              <div key={course.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="font-semibold text-gray-900">{course.name}</h4>
                  <p className="text-xs text-gray-500">${course.price}</p>
                </div>
                <button 
                  onClick={() => handleEnroll(course.id)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Enroll &rarr;
                </button>
              </div>
            ))}
            {unrolledCourses.length > 3 && (
              <a href="/" className="block text-center text-sm font-medium text-gray-500 hover:text-indigo-600 pt-2">
                View All Public Courses
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

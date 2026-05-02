"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getCourses } from "@/redux/slice/courseSlice";
import { enrollCourse } from "@/redux/slice/enrollmentSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, Award } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { courses, loading } = useSelector((state: RootState) => state.course);
  const { currentUser } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  const handleEnroll = async (courseId: number) => {
    if (!currentUser) {
      toast.error("Please login to enroll in courses");
      router.push("/login");
      return;
    }

    const res = await dispatch(enrollCourse(courseId));
    if (enrollCourse.fulfilled.match(res)) {
      // Success handled by toast in slice
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Elevate Your <span className="text-indigo-600">Learning</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover a wide range of expert-led courses designed to help you master new skills and advance your career.
            </p>
            {!currentUser && (
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <Link
                    href="/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get started
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Available Courses</h2>
        
        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                actionLabel="Enroll Now"
                onAction={() => handleEnroll(course.id)}
              />
            ))}
            {courses.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No courses available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                title: "Flexible Learning",
                desc: "Study at your own pace from anywhere in the world.",
                icon: BookOpen,
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                title: "Expert Instruction",
                desc: "Learn from top industry professionals with years of experience.",
                icon: Users,
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
              {
                title: "Recognized Certification",
                desc: "Receive certificates to showcase your achievements to employers.",
                icon: Award,
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className={`${feature.bg} p-3 rounded-xl mb-4`}>
                    <Icon size={24} className={feature.color} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

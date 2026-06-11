"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchSession } from "@/redux/slice/userSlice";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";
import { usePathname, useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, loading } = useSelector((state: RootState) => state.user);
  const { enrollments, loading: enrollLoading } = useSelector((state: RootState) => state.enrollment);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      dispatch(fetchSession());
    } else if (currentUser.role === "USER") {
      dispatch(getUserEnrollments());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    if (currentUser?.role === "USER" && !enrollLoading && enrollments) {
      const hasApproved = enrollments.some(e => e.status === "APPROVED");
      const protectedRoutes = [
        "/dashboard/exams", 
        "/dashboard/certificates", 
        "/dashboard/progress", 
        "/dashboard/history", 
        "/dashboard/enrollments",
        "/dashboard/lessons"
      ];
      
      const isTryingToAccessProtected = protectedRoutes.some(route => pathname.startsWith(route));
      
      if (!hasApproved && isTryingToAccessProtected) {
        router.push("/dashboard");
      }
    }
  }, [currentUser, enrollments, enrollLoading, pathname, router]);

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN";

  // 🔒 For admins: never block on enrollment loading (they use a separate slice fetch)
  // 🔒 For students: block until enrollments are loaded so sidebar/routes are correct
  const shouldBlockOnEnroll = !isAdmin && enrollLoading;

  if ((loading && !currentUser) || shouldBlockOnEnroll) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-[calc(100vh-4rem)] w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

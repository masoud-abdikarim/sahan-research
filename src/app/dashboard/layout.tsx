"use client";

import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchSession } from "@/redux/slice/userSlice";
import Loader from "@/components/Loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, loading } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (!currentUser) {
      dispatch(fetchSession());
    }
  }, [dispatch, currentUser]);

  if (loading && !currentUser) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-500">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/slice/userSlice";
import toast from "react-hot-toast";

export default function AxiosInterceptor({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isRedirecting = useRef(false);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only handle 401 if we are not already redirecting
        if (error.response?.status === 401 && !isRedirecting.current) {
          // If already on login page, just ignore 401s
          if (window.location.pathname === "/login") {
            return Promise.reject(error);
          }

          const isManualLogout = localStorage.getItem("manual-logout");
          if (isManualLogout) {
            localStorage.removeItem("manual-logout");
          }

          isRedirecting.current = true;
          
          dispatch(logout());
          
          // Only show toast if it's NOT a manual logout
          if (!isManualLogout) {
            toast.error("Session expired. Please login.", { id: "session-expired" });
          }
          
          // Trigger logout event for other tabs
          localStorage.setItem("logout-event", Date.now().toString());
          
          router.push("/login");
          
          // Reset after a delay
          setTimeout(() => {
            isRedirecting.current = false;
          }, 5000);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [dispatch, router]);

  return <>{children}</>;
}

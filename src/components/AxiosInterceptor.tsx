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
        const isManualLogout = typeof window !== "undefined" && localStorage.getItem("manual-logout");
        
        // Silently suppress all error toasts and catches while manually logging out
        if (isManualLogout) {
          return new Promise(() => {});
        }

        const isAuthRequest = error.config?.url?.includes("/api/auth/login") || (error.config?.url?.includes("/api/user") && error.config?.method?.toLowerCase() === 'post');

        // If it's a 401 and we are already redirecting or it's a manual logout, 
        // just suppress the error and don't show any toasts.
        if (error.response?.status === 401) {
          if (isManualLogout || isAuthRequest) {
            return Promise.reject(error); // Return the error for auth requests to handle locally
          }

          // If already on login page, just ignore 401s
          if (window.location.pathname === "/login") {
            return Promise.reject(error);
          }

          if (isRedirecting.current) {
            return new Promise(() => {}); // Hang subsequent requests while redirecting to avoid console errors
          }

          isRedirecting.current = true;
          
          dispatch(logout());
          
          // Trigger logout event for other tabs
          localStorage.setItem("logout-event", Date.now().toString());
          
          router.push("/login");
          
          // Reset after a delay
          setTimeout(() => {
            isRedirecting.current = false;
          }, 5000);
          
          return new Promise(() => {});
        }

        // Log 404 errors to help debugging
        if (error.response?.status === 404) {
          console.error(`[AxiosInterceptor] 404 Not Found on ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            data: error.response?.data
          });
        }

        // Log 500 errors to help debugging
        if (error.response?.status === 500) {
          const config = error.config || {};
          const response = error.response || {};
          
          console.error(`[AxiosInterceptor] 500 Error on ${config.method?.toUpperCase()} ${config.url}:`, {
            data: response.data,
            headers: response.headers,
            config: config
          });

          // Show a descriptive toast for 500 errors
          const errorMessage = response.data?.message || response.data?.details || "A server error occurred. Please try again later.";
          toast.error(`Server Error: ${errorMessage}`, { id: "server-500-error" });
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

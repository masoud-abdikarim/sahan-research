"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { logout } from "@/redux/slice/userSlice";
import axios from "axios";

export default function SessionWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    // Only watch sessions on protected routes
    if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
      return;
    }

    const checkSession = async () => {
      if (!currentUser) return;

      try {
        // Lightweight check to see if session is still valid on backend
        await axios.get("/api/auth/me");
      } catch (err: any) {
        if (err.response?.status === 401) {
          // Session expired or deleted
          dispatch(logout());
          // Redirection is usually handled by the AxiosInterceptor we added
          // but we can enforce it here too
          router.push("/login");
        }
      }
    };

    // Check every 30 seconds (less aggressive than 10s)
    const interval = setInterval(checkSession, 30000);

    // Also check on window focus
    window.addEventListener("focus", checkSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkSession);
    };
  }, [pathname, currentUser, dispatch, router]);

  return null;
}

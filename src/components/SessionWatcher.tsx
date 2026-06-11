"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { logout } from "@/redux/slice/userSlice";

export default function SessionWatcher() {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    // Only watch sessions on protected routes
    if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
      return;
    }

    // Instead of polling, we listen for storage events (multi-tab logout sync)
    // When one tab logs out, we clear other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "logout-event") {
        dispatch(logout());
        window.location.href = "/";
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [pathname, dispatch]);

  return null;
}

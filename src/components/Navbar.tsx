"use client";

import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { currentUser } = useSelector((state: RootState) => state.user);



  if (!currentUser) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 h-16 flex items-center justify-between px-6 lg:px-10">
      <div className="flex-1"></div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <User size={16} />
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-gray-700">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

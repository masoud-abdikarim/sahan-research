"use client";

import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { User, FlaskConical, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { currentUser } = useSelector((state: RootState) => state.user);

  if (!currentUser) return null;

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-10 transition-colors">
      <div className="flex-1 flex items-center gap-4">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu size={24} />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 group">
          <img 
            src="/logo.jpeg" 
            alt="Sahan Studies Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 group-hover:scale-105 transition-transform" 
          />
          <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
            Sahan <span className="text-indigo-600 dark:text-indigo-400 transition-colors"></span>
          </span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4 sm:space-x-6">
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <User size={16} />
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-gray-700 dark:text-slate-200">{currentUser.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

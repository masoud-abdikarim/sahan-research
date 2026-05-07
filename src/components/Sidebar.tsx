"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { RootState, AppDispatch } from "@/redux/store";
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  UserCheck, 
  TrendingUp,
  Users,
  Shield,
  Settings,
  LogOut,
  Search,
  History,
  X
} from "lucide-react";
import { logoutUser, logout } from "@/redux/slice/userSlice";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  // Auto-close sidebar on navigation for mobile
  useEffect(() => {
    if (window.innerWidth < 1024 && onClose && isOpen) {
      onClose();
    }
  }, [pathname]);

  const handleLogout = async () => {
    // Auto-close on mobile
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }

    // 1. Mark as manual logout to suppress interceptor toasts
    localStorage.setItem("manual-logout", "true");
    
    // 2. Clear state immediately
    dispatch(logout());
    
    // 3. Redirect first for instant UI response
    router.push("/login");
    
    // 4. Perform background cleanup
    await dispatch(logoutUser());
    
    // 5. Cleanup flag after a short delay to ensure all pending requests are handled
    setTimeout(() => {
      localStorage.removeItem("manual-logout");
    }, 1000);
  };

  const adminNav = [
    { name: "Admin Home", href: "/dashboard/admin", icon: Shield },
    { name: "Manage Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Manage Lessons", href: "/dashboard/lessons", icon: Video },
    { name: "Approval Queue", href: "/dashboard/admin/enrollments", icon: UserCheck },
    { name: "Completion History", href: "/dashboard/admin/completion-history", icon: TrendingUp },
    { name: "Manage Users", href: "/dashboard/admin/users", icon: Users },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const studentNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Learning", href: "/dashboard/enrollments", icon: BookOpen },
    { name: "Active Courses", href: "/dashboard/active-courses", icon: Search },
    { name: "My Progress", href: "/dashboard/progress", icon: TrendingUp },
    { name: "My History", href: "/dashboard/history", icon: History },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const navigation = isAdmin ? adminNav : studentNav;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed inset-y-0 left-0 z-[70] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 
        h-[100dvh] lg:h-[calc(100vh-4rem)] top-0 lg:top-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Mobile Header in Sidebar */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 dark:border-slate-800 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-black text-gray-900 dark:text-white tracking-tighter">Sahan Research</span>
          </Link>
          <button onClick={onClose} className="p-2 text-gray-500"><X size={20} /></button>
        </div>
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="px-4 mb-4 hidden lg:block">
            <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              {isAdmin ? "System Administration" : "Learning Portal"}
            </p>
          </div>
          <nav className="flex-1 px-3 space-y-1 bg-white dark:bg-slate-900" aria-label="Sidebar">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onClose) {
                      onClose();
                    }
                  }}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all
                    ${isActive 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm" 
                      : "text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon
                    className={`
                      flex-shrink-0 -ml-1 mr-3 h-5 w-5
                      ${isActive ? "text-indigo-700 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"}
                    `}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
          <button
            onClick={handleLogout}
            className="flex-shrink-0 w-full group block"
          >
            <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <LogOut className="flex-shrink-0 mr-3 h-5 w-5 text-red-500 dark:text-red-400 group-hover:text-red-600" aria-hidden="true" />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

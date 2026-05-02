"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  UserCheck, 
  TrendingUp,
  Users,
  Shield,
  Settings
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const adminNav = [
    { name: "Admin Home", href: "/dashboard/admin", icon: Shield },
    { name: "Manage Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Manage Lessons", href: "/dashboard/lessons", icon: Video },
    { name: "Approval Queue", href: "/dashboard/admin/enrollments", icon: UserCheck },
    { name: "Manage Users", href: "/dashboard/admin/users", icon: Users },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const studentNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Learning", href: "/dashboard/enrollments", icon: BookOpen },
    { name: "My Progress", href: "/dashboard/progress", icon: TrendingUp },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const navigation = isAdmin ? adminNav : studentNav;

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {isAdmin ? "System Administration" : "Learning Portal"}
          </p>
        </div>
        <nav className="flex-1 px-3 space-y-1 bg-white" aria-label="Sidebar">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                  ${isActive 
                    ? "bg-indigo-50 text-indigo-700 font-semibold" 
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }
                `}
              >
                <Icon
                  className={`
                    flex-shrink-0 -ml-1 mr-3 h-5 w-5
                    ${isActive ? "text-indigo-700" : "text-gray-400 group-hover:text-indigo-600"}
                  `}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

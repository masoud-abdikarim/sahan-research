import { Clock, DollarSign } from "lucide-react";
import { Course } from "@/redux/slice/courseSlice";

interface CourseCardProps {
  course: Course;
  onAction?: () => void;
  actionLabel?: string;
}

export default function CourseCard({ course, onAction, actionLabel }: CourseCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-xl border border-gray-100 dark:border-slate-800 hover:shadow-md dark:hover:shadow-indigo-900/10 transition-all flex flex-col h-full group">
      {/* Course Image */}
      <div className="relative h-48 w-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
        {course.imageUrl ? (
          <img 
            src={course.imageUrl} 
            alt={course.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
            <div className="w-12 h-12 rounded-full bg-white/50 dark:bg-slate-800/50 flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-200 dark:text-indigo-800">{course.name.charAt(0)}</span>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-50 dark:border-indigo-900/30 uppercase tracking-wider">
            {course.category}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={course.name}>
            {course.name}
          </h3>
        </div>

        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-slate-500 mb-6 uppercase tracking-widest mt-auto">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-500 dark:text-indigo-400" />
            <span>{course.durationMonths} Months</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={14} className="text-emerald-500" />
            <span className="text-gray-900 dark:text-slate-200">${course.price}</span>
          </div>
        </div>

        <div className="mt-auto">
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-black py-3 px-4 rounded-xl transition-all border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm text-xs uppercase tracking-widest"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

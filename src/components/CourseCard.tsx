import { Clock, DollarSign, Star, Users, ArrowRight, PlayCircle } from "lucide-react";
import { Course } from "@/redux/slice/courseSlice";

interface CourseCardProps {
  course: Course;
  onAction?: () => void;
  actionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
}

export default function CourseCard({ 
  course, 
  onAction, 
  actionLabel,
  onSecondaryAction,
  secondaryActionLabel 
}: CourseCardProps) {
  const isVideo = course.imageUrl?.match(/\.(mp4|webm|ogg|mov)$/i) || course.imageUrl?.includes("video");

  return (
    <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-black/40 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 transition-all duration-500 flex flex-col h-full group relative">
      {/* Course Media */}
      <div className="relative aspect-[16/10] w-full bg-gray-100 dark:bg-slate-800 overflow-hidden rounded-[2.5rem] p-3">
        <div className="w-full h-full rounded-[2rem] overflow-hidden relative">
          {course.imageUrl ? (
            isVideo ? (
              <video 
                src={`${course.imageUrl}#t=0.1`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                preload="metadata"
                muted
                playsInline
              />
            ) : (
              <img 
                src={course.imageUrl} 
                alt={course.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
              <span className="text-6xl font-black text-white/20">{course.name.charAt(0)}</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
            <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <PlayCircle size={16} />
              Preview Course
            </div>
          </div>
        </div>

        {/* Floating Category Badge */}
        <div className="absolute top-6 left-6">
          <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-indigo-600 dark:text-indigo-400 shadow-xl border border-white/20 uppercase tracking-widest">
            {course.category}
          </span>
        </div>
      </div>

      <div className="p-8 pt-4 flex-1 flex flex-col">
        {/* Instructor & Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-black">
              {course.instructor?.charAt(0) || "I"}
            </div>
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
              {course.instructor || "Sahan Instructor"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">4.9</span>
          </div>
        </div>

        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {course.name}
        </h3>

        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-8 font-medium leading-relaxed">
          {course.description}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 py-6 border-t border-gray-50 dark:border-slate-800/50 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/50 dark:border-indigo-900/30">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Duration</p>
              <p className="text-xs font-black text-gray-900 dark:text-white">{course.durationMonths} Months</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100/50 dark:border-emerald-900/30">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Fee/month</p>
              <p className="text-xs font-black text-gray-900 dark:text-white">${course.price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-4">
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-gray-200 dark:shadow-none text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 group/btn"
            >
              {actionLabel}
              <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="w-full bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-black py-3 px-6 rounded-2xl transition-all border border-gray-100 dark:border-slate-800 text-[10px] uppercase tracking-widest hover:border-indigo-100 dark:hover:border-indigo-900/30"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

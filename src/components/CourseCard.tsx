import { Clock, DollarSign } from "lucide-react";
import { Course } from "@/redux/slice/courseSlice";

interface CourseCardProps {
  course: Course;
  onAction?: () => void;
  actionLabel?: string;
}

export default function CourseCard({ course, onAction, actionLabel }: CourseCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
      {/* Course Image */}
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        {course.imageUrl ? (
          <img 
            src={course.imageUrl} 
            alt={course.name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
            <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-200">{course.name.charAt(0)}</span>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-indigo-600 shadow-sm border border-indigo-50">
            {course.category}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-gray-900 truncate" title={course.name}>
            {course.name}
          </h3>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
          {course.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-indigo-500" />
            <span>{course.durationMonths} months</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={16} className="text-green-500" />
            <span className="font-medium text-gray-900">${course.price}</span>
          </div>
        </div>

        <div className="mt-auto">
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-2.5 px-4 rounded-xl transition-all border border-indigo-100/50 shadow-sm"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

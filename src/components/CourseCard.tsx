import { Clock, DollarSign } from "lucide-react";
import { Course } from "@/redux/slice/courseSlice";

interface CourseCardProps {
  course: Course;
  onAction?: () => void;
  actionLabel?: string;
}

export default function CourseCard({ course, onAction, actionLabel }: CourseCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            {course.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {course.category}
          </span>
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

        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

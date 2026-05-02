import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all APPROVED enrollments for this user with related lessons and progress
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        userId: session.id,
        status: "APPROVED" 
      },
      include: {
        course: {
          include: {
            lessons: true
          }
        },
        progress: true
      }
    });

    let activeCourses = 0;
    let completedCourses = 0;
    let lessonsCompleted = 0;

    enrollments.forEach(enrollment => {
      const totalLessonsInCourse = enrollment.course.lessons.length;
      const completedInThisCourse = enrollment.progress.filter(p => p.completed).length;
      
      // Total lessons completed across all courses
      lessonsCompleted += completedInThisCourse;

      // Logic: 
      // 1. If all lessons are completed (and course has lessons), it's COMPLETED
      // 2. Otherwise, it's ACTIVE (approved but not yet finished)
      if (totalLessonsInCourse > 0 && completedInThisCourse === totalLessonsInCourse) {
        completedCourses++;
      } else {
        // Even if 0 lessons completed, if it's approved, it's ACTIVE
        activeCourses++;
      }
    });

    return NextResponse.json({
      totalCourses: enrollments.length,
      activeCourses,
      completedCourses,
      lessonsCompleted,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

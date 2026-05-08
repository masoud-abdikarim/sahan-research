import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: Number(session.id) },
      include: { 
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  select: { id: true, order: true }
                }
              }
            }
          }
        },
        progress: {
          where: { completed: true },
          include: {
            lesson: {
              select: { order: true }
            }
          }
        },
        _count: {
          select: { progress: true }
        }
      }
    });

    // Transform to include percentage and counts directly
    const transformedEnrollments = enrollments.map((e) => {
      // Flatten lessons from all modules
      const allLessons = e.course.modules.flatMap(m => m.lessons);
      let totalLessonsCount = allLessons.length;
      let completedLessonsCount = e._count.progress;

      // 🔒 CORE RULE: Use Snapshot for Completed Students
      if (e.isCompleted && e.totalLessonsAtTimeOfCompletion) {
        totalLessonsCount = e.totalLessonsAtTimeOfCompletion;
        completedLessonsCount = e.totalLessonsAtTimeOfCompletion; 
      } else {
        // 🔒 Case 2: For in-progress students, ignore lessons inserted "behind" them
        const completedOrders = e.progress.map(p => p.lesson.order);
        const maxCompletedOrder = completedOrders.length > 0 ? Math.max(...completedOrders) : -1;

        // Valid lessons = all lessons currently in course EXCEPT those with order < maxCompletedOrder that are NOT completed
        // Actually, it's simpler: Total lessons for THIS student = Total lessons in course - (Lessons with order < maxCompletedOrder that are NOT completed)
        const ignoredLessons = allLessons.filter(l => l.order < maxCompletedOrder && !completedOrders.includes(l.order));
        
        totalLessonsCount = allLessons.length - ignoredLessons.length;
        completedLessonsCount = e.progress.length;
      }
      
      const progressPercentage = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;
      
      return {
        ...e,
        totalLessons: totalLessonsCount,
        completedLessons: completedLessonsCount,
        progressPercentage,
      };
    });

    return NextResponse.json({ enrollments: transformedEnrollments });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // 🔒 Security: Block ADMIN from enrolling
    if (session.role === "ADMIN") {
      return NextResponse.json({ 
        message: "Admin accounts cannot enroll in courses. Enrollment is reserved for students only." 
      }, { status: 403 });
    }

    const { courseId } = await req.json();

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: Number(session.id),
          courseId: Number(courseId)
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ 
        message: "Already enrolled" 
      }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: Number(session.id),
        courseId: Number(courseId),
      },
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    return NextResponse.json({ message: "Failed to enroll" }, { status: 500 });
  }
}

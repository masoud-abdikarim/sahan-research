import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";


// ✅ GET NEXT AVAILABLE LESSON
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId: enrollmentIdStr } = await params;
    const enrollmentId = Number(enrollmentIdStr);

    // get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
        progress: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "Enrollment not found" },
        { status: 404 }
      );
    }

    // 🔒 block if not approved
    if (enrollment.status !== "APPROVED") {
      return NextResponse.json(
        { message: "Not approved yet" },
        { status: 403 }
      );
    }

    const lessons = enrollment.course.lessons;
    const progress = enrollment.progress;

    // Find the highest order lesson the student has completed
    const completedOrders = progress
      .filter(p => p.completed)
      .map(p => {
        const lesson = lessons.find(l => l.id === p.lessonId);
        return lesson ? lesson.order : -1;
      });
    const maxCompletedOrder = completedOrders.length > 0 ? Math.max(...completedOrders) : -1;

    // find first incomplete lesson that wasn't bypassed
    let nextLesson = null;

    for (let lesson of lessons) {
      const done = progress.find(
        (p) => p.lessonId === lesson.id && p.completed
      );

      // If not done AND it's not a lesson inserted in the past
      if (!done && lesson.order >= maxCompletedOrder) {
        nextLesson = lesson;
        break;
      }
    }

    // 📊 CALCULATE STATS
    let totalLessonsCount = lessons.length;
    let completedLessonsCount = progress.filter(p => p.completed).length;
    let remainingLessons = totalLessonsCount - completedLessonsCount;

    if (enrollment.isCompleted && enrollment.totalLessonsAtTimeOfCompletion) {
      totalLessonsCount = enrollment.totalLessonsAtTimeOfCompletion;
      completedLessonsCount = enrollment.totalLessonsAtTimeOfCompletion;
      remainingLessons = 0;
    } else {
      // Ignore lessons inserted "behind" them
      const ignoredLessons = lessons.filter(l => l.order < maxCompletedOrder && !completedOrders.includes(l.order));
      totalLessonsCount = lessons.length - ignoredLessons.length;
      completedLessonsCount = progress.filter(p => p.completed).length;
      remainingLessons = totalLessonsCount - completedLessonsCount;
    }

    return NextResponse.json(
      {
        nextLesson,
        stats: {
          totalLessons: totalLessonsCount,
          completedLessons: completedLessonsCount,
          remainingLessons: Math.max(0, remainingLessons),
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
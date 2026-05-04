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

    return NextResponse.json(
      {
        nextLesson,   // 👈 ONLY this lesson should be accessible
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
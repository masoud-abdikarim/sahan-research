import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";


// ✅ MARK LESSON AS COMPLETED
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enrollmentId, lessonId } = body;

    if (!enrollmentId || !lessonId) {
      return NextResponse.json(
        { message: "enrollmentId and lessonId are required" },
        { status: 400 }
      );
    }

    // 1. Fetch enrollment to check completion status
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollmentId) },
      include: {
        course: {
          include: {
            lessons: { orderBy: { order: 'asc' } }
          }
        }
      }
    });

    if (!enrollment) return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });

    // 🔒 CORE RULE: If already completed, ignore progress updates
    if (enrollment.isCompleted) {
      return NextResponse.json({ message: "Course already completed. Progress is locked.", enrollment }, { status: 200 });
    }

    // 2. Mark lesson as completed
    let progress = await prisma.progress.findFirst({
      where: {
        enrollmentId: Number(enrollmentId),
        lessonId: Number(lessonId),
      },
    });

    if (progress) {
      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: { completed: true },
      });
    } else {
      progress = await prisma.progress.create({
        data: {
          enrollmentId: Number(enrollmentId),
          lessonId: Number(lessonId),
          completed: true,
        },
      });
    }

    // 3. Check for Course Completion (100% logic)
    const allProgress = await prisma.progress.findMany({
      where: { enrollmentId: Number(enrollmentId), completed: true }
    });

    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = allProgress.length;

    if (totalLessons > 0 && completedLessons >= totalLessons) {
      // Create Immutable Snapshot
      await prisma.enrollment.update({
        where: { id: Number(enrollmentId) },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          lastLessonCompletedId: Number(lessonId)
        }
      });
    }

    return NextResponse.json(
      { message: "Lesson marked as completed", progress },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Mark Progress Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
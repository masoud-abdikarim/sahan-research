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
            modules: {
              include: {
                lessons: { orderBy: { order: "asc" } },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!enrollment)
      return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });

    // 🔒 CORE RULE: If already completed, ignore progress updates
    if (enrollment.isCompleted) {
      return NextResponse.json(
        { message: "Course already completed. Progress is locked.", enrollment },
        { status: 200 }
      );
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

    // 3. Update total progress percentage
    const allCourseLessons = enrollment.course.modules.flatMap((m) => m.lessons);
    const totalLessonsCount = allCourseLessons.length;

    const completedProgress = await prisma.progress.count({
      where: {
        enrollmentId: Number(enrollmentId),
        completed: true,
      },
    });

    const progressPercentage = totalLessonsCount > 0 ? (completedProgress / totalLessonsCount) * 100 : 0;

    await prisma.enrollment.update({
      where: { id: Number(enrollmentId) },
      data: {
        totalProgress: progressPercentage,
      },
    });

    return NextResponse.json(
      { message: "Lesson marked as completed", progress, progressPercentage },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Mark Progress Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

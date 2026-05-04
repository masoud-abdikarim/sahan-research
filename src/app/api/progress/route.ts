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

    // 3. Check for Course Completion (Dynamic & Immutable Logic)
    const allProgress = await prisma.progress.findMany({
      where: { enrollmentId: Number(enrollmentId), completed: true }
    });

    const currentLessons = enrollment.course.lessons;
    
    // Find highest order lesson the student has completed
    const completedOrders = allProgress.map(p => {
      const lesson = currentLessons.find(l => l.id === p.lessonId);
      return lesson ? lesson.order : -1;
    });
    const maxCompletedOrder = completedOrders.length > 0 ? Math.max(...completedOrders) : -1;

    // A student is completed if they have finished all lessons 
    // EXCEPT those that were inserted "behind" their progress later.
    const requiredLessons = currentLessons.filter(l => l.order >= maxCompletedOrder);
    const completedRequiredLessons = allProgress.filter(p => {
      const lesson = currentLessons.find(l => l.id === p.lessonId);
      return lesson && lesson.order >= maxCompletedOrder;
    });

    const isFullyDone = requiredLessons.every(rl => 
      allProgress.some(ap => ap.lessonId === rl.id)
    );

    if (currentLessons.length > 0 && isFullyDone) {
      // Create Immutable Snapshot
      await prisma.enrollment.update({
        where: { id: Number(enrollmentId) },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          lastLessonCompletedId: Number(lessonId),
          totalLessonsAtTimeOfCompletion: currentLessons.length
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
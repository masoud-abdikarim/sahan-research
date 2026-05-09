import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return NextResponse.json({ message: "Enrollment ID is required" }, { status: 400 });
    }

    // 1. Find the enrollment and its course
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollmentId) },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  orderBy: { order: "asc" }
                }
              }
            }
          }
        },
        progress: {
          where: { completed: true },
          select: { lessonId: true }
        }
      }
    });

    if (!enrollment || enrollment.userId !== Number(session.id)) {
      return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });
    }

    const allLessons = enrollment.course.modules.flatMap(m => m.lessons).sort((a, b) => a.order - b.order);

    // 2. Identify completed lesson IDs
    const completedLessonIds = new Set(enrollment.progress.map(p => p.lessonId));

    // 3. Find the highest order lesson the student has completed
    const completedOrders = allLessons
      .filter(l => completedLessonIds.has(l.id))
      .map(l => l.order);
    const maxCompletedOrder = completedOrders.length > 0 ? Math.max(...completedOrders) : -1;

    // 4. Find the first incomplete lesson that wasn't bypassed
    const nextLesson = allLessons.find(lesson => 
      !completedLessonIds.has(lesson.id) && lesson.order >= maxCompletedOrder
    );

    // 5. Calculate stable progress for the UI
    let totalLessonsCount = allLessons.length;
    let completedLessonsCount = completedLessonIds.size;
    let remainingLessons = totalLessonsCount - completedLessonsCount;

    if (enrollment.isCompleted && enrollment.totalLessonsAtTimeOfCompletion) {
      totalLessonsCount = enrollment.totalLessonsAtTimeOfCompletion;
      completedLessonsCount = enrollment.totalLessonsAtTimeOfCompletion;
      remainingLessons = 0;
    } else {
      // 🔒 Case 2: Ignore lessons inserted "behind" them
      const ignoredLessons = allLessons.filter(l => 
        l.order < maxCompletedOrder && !completedLessonIds.has(l.id)
      );
      totalLessonsCount = allLessons.length - ignoredLessons.length;
      completedLessonsCount = completedLessonIds.size;
      remainingLessons = totalLessonsCount - completedLessonsCount;
    }

    const progressPercentage = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

    return NextResponse.json({
      nextLesson: nextLesson || null,
      stats: {
        totalLessons: totalLessonsCount,
        completedLessons: completedLessonsCount,
        remainingLessons: Math.max(0, remainingLessons),
        progressPercentage,
        isCompleted: enrollment.isCompleted
      }
    });
  } catch (error) {
    console.error("[PROGRESS_GET_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { lessonId, courseId, enrollmentId } = body;

    if (!lessonId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. Find Enrollment
    let enrollment;
    if (enrollmentId) {
      enrollment = await prisma.enrollment.findUnique({
         where: { id: Number(enrollmentId) }
      });
    } else if (courseId) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: Number(session.id),
            courseId: Number(courseId)
          }
        }
      });
    } else {
      return NextResponse.json({ message: "Provide enrollmentId or courseId" }, { status: 400 });
    }

    if (!enrollment || enrollment.status !== "APPROVED" || enrollment.userId !== Number(session.id)) {
      return NextResponse.json({ message: "Valid enrollment required" }, { status: 403 });
    }

    // 2. Mark Progress (Upsert)
    const progress = await prisma.progress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: Number(lessonId)
        }
      },
      update: {
        completed: true
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: Number(lessonId),
        completed: true
      }
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[PROGRESS_UPDATE_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

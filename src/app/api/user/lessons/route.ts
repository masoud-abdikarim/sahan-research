import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const finalLessons: any[] = [];

    if (courseId) {
      // ── SINGLE COURSE VIEW ──
      const cid = Number(courseId);
      
      // Security Check: Only Admin or Approved Students
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.id, courseId: cid } }
      });

      if (session.role !== "ADMIN" && (!enrollment || enrollment.status !== "APPROVED")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const courseLessons = await prisma.lesson.findMany({
        where: { courseId: cid },
        orderBy: { order: 'asc' },
        include: {
          course: true,
          Progress: {
            where: { enrollment: { userId: session.id, courseId: cid } }
          }
        }
      });

      courseLessons.forEach((lesson, index) => {
        if (session.role === "ADMIN") {
          finalLessons.push({ ...lesson, unlocked: true, completed: lesson.Progress[0]?.completed || false });
          return;
        }

        // 🔒 CORE RULE: Completion Snapshot Enforcement
        if (enrollment?.isCompleted) {
          // Only show lessons that were part of the course when they completed it
          if (lesson.order <= (enrollment.finalLessonOrder || 0)) {
            finalLessons.push({
              ...lesson,
              unlocked: true,
              completed: true,
              isSnapshot: true // Flag for UI
            });
          }
          // Lessons with order > finalLessonOrder are NOT returned for completed students
          return;
        }

        const isFirst = index === 0;
        const prevLessonCompleted = index > 0 ? (courseLessons[index - 1].Progress[0]?.completed || false) : false;
        const unlocked = isFirst || prevLessonCompleted;

        const safeLesson = unlocked ? lesson : { ...lesson, videoUrl: "" };

        finalLessons.push({
          ...safeLesson,
          unlocked,
          completed: lesson.Progress[0]?.completed || false
        });
      });
    } else {
      // ── ALL ENROLLED LESSONS VIEW ──
      const myEnrollments = await prisma.enrollment.findMany({
        where: { userId: session.id, status: "APPROVED" },
        select: { courseId: true, isCompleted: true, finalLessonOrder: true }
      });

    for (const enrollment of myEnrollments) {
      const courseLessons = await prisma.lesson.findMany({
        where: { courseId: enrollment.courseId },
        orderBy: { order: 'asc' },
        include: {
          Progress: {
            where: { enrollment: { userId: session.id, courseId: enrollment.courseId } }
          }
        }
      });

      // Find the highest order lesson the student has completed
      const completedOrders = courseLessons
        .filter(l => l.Progress[0]?.completed)
        .map(l => l.order);
      const maxCompletedOrder = completedOrders.length > 0 ? Math.max(...completedOrders) : -1;

      courseLessons.forEach((lesson, index) => {
        const isCompleted = lesson.Progress[0]?.completed || false;
        
        // 🔒 CORE RULE: Completion Snapshot Enforcement
        if (enrollment.isCompleted) {
          if (lesson.order <= (enrollment.finalLessonOrder || 0)) {
            finalLessons.push({
              ...lesson,
              unlocked: true,
              completed: true,
              isSnapshot: true
            });
          }
          return;
        }

        // 🔒 Case 2: If this lesson has a lower order than the highest completed lesson,
        // and it's NOT completed, it was likely inserted later. 
        // We skip/ignore it for sequential blocking.
        const wasInsertedLater = !isCompleted && lesson.order < maxCompletedOrder;

        const isFirst = index === 0;
        
        // Find the "real" previous lesson (ignoring later inserted ones)
        let prevLessonCompleted = false;
        if (index > 0) {
           const prevLesson = courseLessons[index - 1];
           prevLessonCompleted = prevLesson.Progress[0]?.completed || (prevLesson.order < maxCompletedOrder);
        }

        const unlocked = isFirst || prevLessonCompleted || wasInsertedLater;

        // If it was inserted later and we are ignoring it, we still show it but it doesn't block.
        // Actually, the user says "Those lessons are ignored for that student".
        // I'll mark them as unlocked so they can watch if they want, but they won't block the next lesson.

        const safeLesson = unlocked ? lesson : { ...lesson, videoUrl: "" };

        finalLessons.push({
          ...safeLesson,
          unlocked,
          completed: isCompleted,
          ignored: wasInsertedLater // Metadata for UI if needed
        });
      });
    }
    }

    return NextResponse.json({ lessons: finalLessons });
  } catch (error: any) {
    console.error("GET Lessons Error:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}

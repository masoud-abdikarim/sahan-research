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

        // 🔒 CORE RULE: If enrollment is marked as completed, all its lessons are unlocked
        if (enrollment?.isCompleted) {
          finalLessons.push({
            ...lesson,
            unlocked: true,
            completed: true
          });
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
        select: { courseId: true, isCompleted: true }
      });

      for (const enrollment of myEnrollments) {
        const courseLessons = await prisma.lesson.findMany({
          where: { courseId: enrollment.courseId },
          orderBy: { order: 'asc' },
          include: {
            course: true,
            Progress: {
              where: { enrollment: { userId: session.id, courseId: enrollment.courseId } }
            }
          }
        });

        courseLessons.forEach((lesson, index) => {
          if (enrollment.isCompleted) {
            finalLessons.push({ ...lesson, unlocked: true, completed: true });
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
      }
    }

    return NextResponse.json({ lessons: finalLessons });
  } catch (error: any) {
    console.error("GET Lessons Error:", error);
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
  }
}

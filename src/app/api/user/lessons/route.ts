import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    // 1. Fetch relevant lessons and progress
    let lessons = [];

    if (courseId) {
      // SINGLE COURSE VIEW
      if (session.role !== "ADMIN") {
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: session.id, courseId: Number(courseId) } }
        });

        if (!enrollment || enrollment.status !== "APPROVED") {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
      }

      lessons = await prisma.lesson.findMany({
        where: { courseId: Number(courseId) },
        orderBy: { order: 'asc' },
        include: {
          course: true,
          Progress: {
            where: {
              enrollment: {
                userId: session.id,
                courseId: Number(courseId)
              }
            }
          }
        }
      });
    } else {
      // ALL ENROLLED LESSONS VIEW
      if (session.role === "ADMIN") {
        lessons = await prisma.lesson.findMany({
          orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
          include: { course: true, Progress: { take: 0 } } // Admins don't need progress here
        });
      } else {
        const myEnrollments = await prisma.enrollment.findMany({
          where: { userId: session.id, status: "APPROVED" },
          select: { courseId: true }
        });

        const myCourseIds = myEnrollments.map(e => e.courseId);

        lessons = await prisma.lesson.findMany({
          where: { courseId: { in: myCourseIds } },
          orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
          include: {
            course: true,
            Progress: {
              where: {
                enrollment: {
                  userId: session.id
                }
              }
            }
          }
        });
      }
    }

    // 2. Calculate Unlocked Status per course
    // Group lessons by courseId first to calculate unlocking correctly
    const groupedByCourse: Record<number, any[]> = {};
    lessons.forEach(l => {
      if (!groupedByCourse[l.courseId]) groupedByCourse[l.courseId] = [];
      groupedByCourse[l.courseId].push(l);
    });

    const finalLessons: any[] = [];

    Object.values(groupedByCourse).forEach(courseLessons => {
      // Sort by order just in case
      courseLessons.sort((a, b) => a.order - b.order);

      courseLessons.forEach((lesson, index) => {
        if (session.role === "ADMIN") {
          finalLessons.push({ ...lesson, unlocked: true, completed: lesson.Progress[0]?.completed || false });
          return;
        }

        const isFirst = index === 0;
        const prevLessonCompleted = index > 0 ? (courseLessons[index - 1].Progress[0]?.completed || false) : false;
        const isCompleted = lesson.Progress[0]?.completed || false;

        finalLessons.push({
          ...lesson,
          unlocked: isFirst || prevLessonCompleted,
          completed: isCompleted
        });
      });
    });

    return NextResponse.json({ lessons: finalLessons });
  } catch (error) {
    console.error("[GET_LESSONS_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

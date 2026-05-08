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
      if (isNaN(cid)) {
        return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
      }
      
      // Security Check: Only Admin or Approved Students
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: Number(session.id), courseId: cid } }
      });

      if (session.role !== "ADMIN" && (!enrollment || enrollment.status !== "APPROVED")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }

      const courseLessons = await prisma.lesson.findMany({
        where: { 
          module: {
            courseId: cid 
          }
        },
        orderBy: { order: 'asc' },
        include: {
          module: {
            include: {
              course: true
            }
          },
          progress: {
            where: { enrollmentId: enrollment?.id || 0 }
          }
        }
      });

      courseLessons.forEach((lesson, index) => {
        const isCompleted = lesson.progress?.[0]?.completed || false;
        
        if (session.role === "ADMIN") {
          finalLessons.push({ ...lesson, unlocked: true, completed: isCompleted });
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
        const prevLessonCompleted = index > 0 ? (courseLessons[index - 1].progress?.[0]?.completed || false) : false;
        const unlocked = isFirst || prevLessonCompleted;

        const safeLesson = unlocked ? lesson : { ...lesson, videoUrl: "" };

        finalLessons.push({
          ...safeLesson,
          unlocked,
          completed: isCompleted
        });
      });
    } else {
      // ── ALL ENROLLED LESSONS VIEW ──
      if (session.role === "ADMIN") {
        const allLessons = await prisma.lesson.findMany({
          orderBy: { order: 'asc' },
          include: {
            module: {
              include: {
                course: true
              }
            },
          }
        });
        
        allLessons.forEach(lesson => {
          finalLessons.push({
            ...lesson,
            unlocked: true,
            completed: false
          });
        });
      } else {
        const myEnrollments = await prisma.enrollment.findMany({
          where: { userId: Number(session.id), status: "APPROVED" },
          select: { id: true, courseId: true, isCompleted: true, finalLessonOrder: true }
        });

        for (const enrollment of myEnrollments) {
          const courseLessons = await prisma.lesson.findMany({
            where: { 
              module: {
                courseId: enrollment.courseId 
              }
            },
            orderBy: { order: 'asc' },
            include: {
              progress: {
                where: { enrollmentId: enrollment.id }
              }
            }
          });

          // Find the highest order lesson the student has completed
          const completedOrders = courseLessons
            .filter(l => l.progress?.[0]?.completed)
            .map(l => l.order);
          const maxCompletedOrder = completedOrders.length > 0 ? Math.max(...completedOrders) : -1;

          courseLessons.forEach((lesson, index) => {
            const isCompleted = lesson.progress?.[0]?.completed || false;
            
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
               prevLessonCompleted = (prevLesson.progress?.[0]?.completed) || (prevLesson.order < maxCompletedOrder);
            }

            const unlocked = isFirst || prevLessonCompleted || wasInsertedLater;

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
    }

    return NextResponse.json({ lessons: finalLessons });
  } catch (error: any) {
    console.error("GET Lessons Error:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      details: error.message || "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

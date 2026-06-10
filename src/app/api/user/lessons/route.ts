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

    // Helper to process a single course's lessons
    async function processCourseLessons(cid: number, enrollment: any, isAdmin: boolean) {
      const courseLessons = await prisma.lesson.findMany({
        where: { module: { courseId: cid } },
        orderBy: { order: 'asc' },
        include: {
          module: { include: { course: true } },
          progress: { where: { enrollmentId: enrollment?.id || 0 } }
        }
      });

      if (isAdmin) {
        courseLessons.forEach(lesson => {
          finalLessons.push({ 
            ...lesson, 
            courseId: lesson.module?.courseId, // Ensure courseId is mapped
            unlocked: true, 
            completed: lesson.progress?.[0]?.completed || false 
          });
        });
        return;
      }

      // Fetch Modules and Exams for strict locking
      const modules = await prisma.module.findMany({
        where: { courseId: cid },
        orderBy: { order: 'asc' },
        include: { exam: true }
      });

      // Fetch Passed Exams
      const stableScores = await prisma.enrollmentExamScore.findMany({
        where: { enrollmentId: enrollment.id, passed: true }
      });
      const passedExamIds = new Set(stableScores.map(s => s.examId));

      // Determine Unlocked Modules
      const unlockedModules = new Set<number>();
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        if (i === 0) {
          unlockedModules.add(m.id);
        } else {
          const prevM = modules[i - 1];
          const prevExamPassed = !prevM.exam || passedExamIds.has(prevM.exam.id);
          if (prevExamPassed) {
            unlockedModules.add(m.id);
          } else {
            break; // If a module is locked, all subsequent are locked
          }
        }
      }

      // Group lessons by moduleId
      const lessonsByModule = new Map<number, typeof courseLessons>();
      courseLessons.forEach(l => {
        if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
        lessonsByModule.get(l.moduleId)!.push(l);
      });

      // Maintain max completed order for "wasInsertedLater" logic
      const completedOrders = courseLessons.filter(l => l.progress?.[0]?.completed).map(l => l.order);
      const maxCompletedOrder = completedOrders.length > 0 ? Math.max(...completedOrders) : -1;

      // ── DAILY LESSON LIMIT LOGIC ──
      const msInDay = 1000 * 60 * 60 * 24;
      const daysSinceEnrollment = enrollment?.createdAt 
        ? Math.floor((Date.now() - new Date(enrollment.createdAt).getTime()) / msInDay) 
        : 0;
      const totalCredits = (daysSinceEnrollment + 1) * 2;
      const usedCredits = completedOrders.length;
      const availableCredits = Math.max(0, totalCredits - usedCredits);
      const nextUnlockTime = enrollment?.createdAt 
        ? new Date(new Date(enrollment.createdAt).getTime() + totalCredits * msInDay) 
        : null;

      courseLessons.forEach((lesson) => {
        const isCompleted = lesson.progress?.[0]?.completed || false;
        
        // 🔒 CORE RULE: Completion Snapshot Enforcement
        if (enrollment?.isCompleted) {
          if (lesson.order <= (enrollment.finalLessonOrder || 0)) {
            finalLessons.push({
              ...lesson,
              courseId: lesson.module?.courseId,
              unlocked: true,
              completed: true,
              isSnapshot: true
            });
          }
          return;
        }

        const isModuleUnlocked = unlockedModules.has(lesson.moduleId);
        let unlocked = false;

        if (isModuleUnlocked) {
          const modLessons = lessonsByModule.get(lesson.moduleId)!;
          // Sort by order just to be safe, though findMany already did
          modLessons.sort((a, b) => a.order - b.order);
          const lessonIndex = modLessons.findIndex(l => l.id === lesson.id);
          
          if (lessonIndex === 0) {
            unlocked = true; // First lesson in unlocked module is unlocked
          } else {
            const prevLesson = modLessons[lessonIndex - 1];
            // Treat 'wasInsertedLater' lessons as completed for unlocking purposes
            const prevCompleted = prevLesson.progress?.[0]?.completed || (!isCompleted && prevLesson.order < maxCompletedOrder);
            unlocked = prevCompleted;
          }
        }

        // Soft-lock prevention for current lesson
        const wasInsertedLater = !isCompleted && lesson.order < maxCompletedOrder;
        if (wasInsertedLater) {
          unlocked = true;
        }

        // ── APPLY DAILY LIMIT ──
        let dailyLocked = false;
        if (unlocked && !isCompleted && !isAdmin) {
          if (availableCredits <= 0) {
            unlocked = false;
            dailyLocked = true;
          }
        }

        const safeLesson = unlocked ? lesson : { ...lesson, videoUrl: "", audioUrls: [] };

        finalLessons.push({
          ...safeLesson,
          courseId: lesson.module?.courseId, // THE FIX FOR FRONTEND ENROLLMENT ERROR!
          unlocked,
          completed: isCompleted,
          ignored: wasInsertedLater,
          dailyLocked,
          availableCredits,
          nextUnlockTime
        });
      });
    }

    if (courseId) {
      // ── SINGLE COURSE VIEW ──
      const cid = Number(courseId);
      if (isNaN(cid)) return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
      
      let enrollment = null;
      if ((session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
        enrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: Number(session.id), courseId: cid } }
        });
        if (!enrollment || enrollment.status !== "APPROVED") {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
      }

      await processCourseLessons(cid, enrollment, (session.role === "ADMIN" || session.role === "SUPERADMIN"));

    } else {
      // ── ALL ENROLLED LESSONS VIEW ──
      if (session.role === "ADMIN") {
        const allLessons = await prisma.lesson.findMany({
          orderBy: { order: 'asc' },
          include: { module: { include: { course: true } } }
        });
        allLessons.forEach(lesson => {
          finalLessons.push({
            ...lesson,
            courseId: lesson.module?.courseId,
            unlocked: true,
            completed: false
          });
        });
      } else {
        const myEnrollments = await prisma.enrollment.findMany({
          where: { userId: Number(session.id), status: "APPROVED" }
        });

        for (const enrollment of myEnrollments) {
          await processCourseLessons(enrollment.courseId, enrollment, false);
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

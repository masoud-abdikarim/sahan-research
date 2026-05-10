import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = Number(searchParams.get("courseId"));
    if (!courseId || Number.isNaN(courseId)) {
      return NextResponse.json({ message: "Valid courseId is required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: Number(session.id), courseId } },
      include: {
        progress: { where: { completed: true }, select: { lessonId: true } },
      },
    });
    if (!enrollment || enrollment.status !== "APPROVED") {
      return NextResponse.json({ message: "Approved enrollment required" }, { status: 403 });
    }

    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
        exam: {
          include: {
            questions: { select: { id: true, marks: true } },
          },
        },
      },
    });

    const finalExam = await prisma.exam.findFirst({
      where: { courseId, type: "FINAL" },
      include: {
        questions: { select: { id: true, marks: true } },
      },
    });

    const completedSet = new Set(enrollment.progress.map((p) => p.lessonId));
    const stableScores = await prisma.enrollmentExamScore.findMany({
      where: { enrollmentId: enrollment.id },
    });
    const attempts = await prisma.examAttempt.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { createdAt: "desc" },
    });
    const stableByExam = new Map(stableScores.map((s) => [s.examId, s]));
    const attemptsByExam = new Map<number, number>();
    attempts.forEach((a) => attemptsByExam.set(a.examId, (attemptsByExam.get(a.examId) || 0) + 1));

    const moduleItems = modules.map((m, index) => {
      const lessonIds = m.lessons.map((l) => l.id);
      const allLessonsDone = lessonIds.length > 0 && lessonIds.every((id) => completedSet.has(id));
      const exam = m.exam;
      const score = exam ? stableByExam.get(exam.id) : null;
      const prevModule = modules[index - 1];
      const prevExamPassed = !prevModule?.exam || Boolean(stableByExam.get(prevModule.exam.id)?.passed);
      const moduleUnlocked = index === 0 || prevExamPassed;
      const examUnlocked = moduleUnlocked && allLessonsDone && Boolean(exam);
      return {
        id: m.id,
        title: m.title,
        order: m.order,
        lessonCount: lessonIds.length,
        completedLessonCount: lessonIds.filter((id) => completedSet.has(id)).length,
        allLessonsDone,
        moduleUnlocked,
        exam: exam
          ? {
              id: exam.id,
              title: exam.title,
              passingMarks: exam.passingMarks,
              totalMarks: exam.totalMarks,
              questionCount: exam.questions.length,
              unlocked: examUnlocked,
              attempts: attemptsByExam.get(exam.id) || 0,
              earnedMarks: score?.earnedMarks ?? 0,
              passed: score?.passed ?? false,
              locked: score?.locked ?? false,
            }
          : null,
      };
    });

    const moduleExams = moduleItems.filter((m) => m.exam).map((m) => m.exam!);
    const allModuleExamsAttempted = moduleExams.every((e) => e.attempts > 0);
    const allLessonsDone = moduleItems.every((m) => m.allLessonsDone);
    
    const finalScore = finalExam ? stableByExam.get(finalExam.id) : null;
    const finalUnlocked = allModuleExamsAttempted && allLessonsDone && Boolean(finalExam);

    const moduleEarned = moduleExams.reduce((sum, e) => sum + e.earnedMarks, 0);
    const moduleTotal = moduleExams.reduce((sum, e) => sum + e.totalMarks, 0);
    const finalEarned = finalScore?.earnedMarks ?? 0;
    const finalTotal = finalExam?.totalMarks ?? 0;
    const totalEarned = moduleEarned + finalEarned;
    const totalPossible = 100;
    const overallPercent = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

    return NextResponse.json({
      enrollmentId: enrollment.id,
      modules: moduleItems,
      finalExam: finalExam
        ? {
            id: finalExam.id,
            title: finalExam.title,
            passingMarks: finalExam.passingMarks,
            totalMarks: finalExam.totalMarks,
            questionCount: finalExam.questions.length,
            unlocked: finalUnlocked,
            attempts: attemptsByExam.get(finalExam.id) || 0,
            earnedMarks: finalScore?.earnedMarks ?? 0,
            passed: finalScore?.passed ?? false,
          }
        : null,
      summary: {
        moduleEarned,
        moduleTotal,
        finalEarned,
        finalTotal,
        totalEarned,
        totalPossible,
        overallPercent,
        status: overallPercent >= 70 && Boolean(finalScore?.passed) ? "PASSED" : "FAILED",
        certificateEligible: overallPercent >= 70 && Boolean(finalScore?.passed),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}


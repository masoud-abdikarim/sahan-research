import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: Number(session.id),
        status: "APPROVED"
      },
      include: {
        course: { select: { id: true, name: true } },
        examScores: {
          include: {
            exam: {
              select: { id: true, title: true, type: true, moduleId: true }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        examAttempts: {
          select: { id: true, examId: true, score: true, passed: true, createdAt: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    // Process and shape the data
    const historyData = enrollments.map(enrollment => {
      const moduleScores = enrollment.examScores.filter(s => s.exam.type === "MODULE");
      const finalScore = enrollment.examScores.find(s => s.exam.type === "FINAL");

      const totalEarned = enrollment.examScores.reduce((sum, s) => sum + s.earnedMarks, 0);
      const totalPossible = 100;
      
      const certificateEligible = enrollment.isCompleted && totalEarned >= 70;

      // Map attempts to their respective exams
      const finalAttempts = enrollment.examAttempts.filter(a => finalScore && a.examId === finalScore.examId);

      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        courseName: enrollment.course.name,
        isCompleted: enrollment.isCompleted,
        totalEarned,
        totalPossible,
        certificateEligible,
        moduleExams: moduleScores.map(ms => ({
          id: ms.exam.id,
          title: ms.exam.title,
          moduleId: ms.exam.moduleId,
          earnedMarks: ms.earnedMarks,
          totalMarks: ms.totalMarks,
          locked: ms.locked,
          date: ms.createdAt,
          // Since module exams are single attempt, we can just grab the first attempt for its date
          attempt: enrollment.examAttempts.find(a => a.examId === ms.exam.id) || null
        })),
        finalExam: finalScore ? {
          id: finalScore.exam.id,
          title: finalScore.exam.title,
          earnedMarks: finalScore.earnedMarks,
          totalMarks: finalScore.totalMarks,
          locked: finalScore.locked,
          attemptsCount: finalAttempts.length,
          attemptsHistory: finalAttempts
        } : null
      };
    });

    return NextResponse.json({ history: historyData });

  } catch (error: any) {
    console.error("GET History Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

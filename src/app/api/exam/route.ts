import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

// ✅ SUBMIT EXAM ATTEMPT
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { examId, answers } = body;

    if (!examId || !answers) {
      return NextResponse.json({ message: "examId and answers are required" }, { status: 400 });
    }

    // 1. Fetch exam and questions
    const exam = await prisma.exam.findUnique({
      where: { id: Number(examId) },
      include: {
        questions: true,
        course: { include: { modules: { include: { lessons: true } } } },
      },
    });

    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: Number(session.id),
          courseId: exam.courseId,
        },
      },
      include: {
        progress: { where: { completed: true }, select: { lessonId: true } },
      },
    });

    if (!enrollment || enrollment.status !== "APPROVED") {
      return NextResponse.json({ message: "Approved enrollment required" }, { status: 403 });
    }

    if (exam.type === "MODULE") {
      if (!exam.moduleId) {
        return NextResponse.json({ message: "Invalid module exam configuration" }, { status: 400 });
      }
      const moduleLessons = exam.course.modules
        .find((m) => m.id === exam.moduleId)
        ?.lessons.map((l) => l.id) || [];
      const completedIds = new Set(enrollment.progress.map((p) => p.lessonId));
      const moduleComplete = moduleLessons.length > 0 && moduleLessons.every((id) => completedIds.has(id));
      if (!moduleComplete) {
        return NextResponse.json({ message: "Complete all module lessons before taking this exam" }, { status: 403 });
      }
    }

    if (exam.type === "FINAL") {
      const moduleExams = await prisma.exam.findMany({
        where: { courseId: exam.courseId, type: "MODULE" },
        select: { id: true },
      });
      const moduleScores = await prisma.enrollmentExamScore.findMany({
        where: {
          enrollmentId: enrollment.id,
          exam: { type: "MODULE", courseId: exam.courseId },
          passed: true,
        },
        select: { examId: true },
      });
      const passedSet = new Set(moduleScores.map((s) => s.examId));
      const allModulesPassed = moduleExams.every((e) => passedSet.has(e.id));
      if (!allModulesPassed) {
        return NextResponse.json({ message: "Pass all module exams before final exam" }, { status: 403 });
      }
    }

    // 2. Calculate score
    let score = 0;
    exam.questions.forEach((question) => {
      // answers is expected to be an object: { questionId: selectedOptionIndex }
      if (question.correctOptions.includes(Number(answers[question.id]))) {
        score += question.marks;
      }
    });

    const percentage = (score / exam.totalMarks) * 100;
    const passed = percentage >= exam.passingMarks;

    // 3. Save attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        userId: Number(session.id),
        enrollmentId: enrollment.id,
        examId: Number(examId),
        score,
        passed,
        answers,
      },
    });

    // 4. Save stable score state
    const existingScore = await prisma.enrollmentExamScore.findUnique({
      where: {
        enrollmentId_examId: {
          enrollmentId: enrollment.id,
          examId: exam.id,
        },
      },
    });

    if (exam.type === "MODULE") {
      // Preserve module marks once passed (locked).
      if (!existingScore || (!existingScore.locked && score > existingScore.earnedMarks)) {
        await prisma.enrollmentExamScore.upsert({
          where: {
            enrollmentId_examId: {
              enrollmentId: enrollment.id,
              examId: exam.id,
            },
          },
          update: {
            earnedMarks: score,
            totalMarks: exam.totalMarks,
            passed,
            locked: passed ? true : existingScore?.locked ?? false,
          },
          create: {
            enrollmentId: enrollment.id,
            examId: exam.id,
            earnedMarks: score,
            totalMarks: exam.totalMarks,
            passed,
            locked: passed,
          },
        });
      }
    } else {
      // Final exam can be retaken; keep best score.
      await prisma.enrollmentExamScore.upsert({
        where: {
          enrollmentId_examId: {
            enrollmentId: enrollment.id,
            examId: exam.id,
          },
        },
        update: {
          earnedMarks: existingScore ? Math.max(existingScore.earnedMarks, score) : score,
          totalMarks: exam.totalMarks,
          passed: (existingScore?.passed ?? false) || passed,
          locked: false,
        },
        create: {
          enrollmentId: enrollment.id,
          examId: exam.id,
          earnedMarks: score,
          totalMarks: exam.totalMarks,
          passed,
          locked: false,
        },
      });
    }

    // 5. Recompute course completion eligibility (>= 70 total)
    const stableScores = await prisma.enrollmentExamScore.findMany({
      where: {
        enrollmentId: enrollment.id,
        exam: { courseId: exam.courseId },
      },
      include: { exam: { select: { type: true } } },
    });
    const totalEarned = stableScores.reduce((sum, s) => sum + s.earnedMarks, 0);
    const totalPossible = stableScores.reduce((sum, s) => sum + s.totalMarks, 0);
    const finalScore = stableScores.find((s) => s.exam.type === "FINAL");
    const percent = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    const canComplete = Boolean(finalScore?.passed) && percent >= 70;

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: canComplete
        ? { isCompleted: true, completedAt: enrollment.completedAt ?? new Date() }
        : { isCompleted: false, completedAt: null },
    });

    return NextResponse.json(
      {
        message: "Exam submitted",
        attempt,
        percentage,
        passed,
        totalEarned,
        totalPossible,
        finalPercentage: totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Submit Exam Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ GET EXAM DETAILS (For students taking the exam)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) return NextResponse.json({ message: "examId is required" }, { status: 400 });

    const exam = await prisma.exam.findUnique({
      where: { id: Number(examId) },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            options: true,
            marks: true,
          },
        },
      },
    });

    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    return NextResponse.json({ exam }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

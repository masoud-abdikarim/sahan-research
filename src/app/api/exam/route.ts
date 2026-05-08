import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";

// ✅ SUBMIT EXAM ATTEMPT
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, examId, answers } = body;

    if (!userId || !examId || !answers) {
      return NextResponse.json({ message: "userId, examId, and answers are required" }, { status: 400 });
    }

    // 1. Fetch exam and questions
    const exam = await prisma.exam.findUnique({
      where: { id: Number(examId) },
      include: { questions: true, course: true },
    });

    if (!exam) return NextResponse.json({ message: "Exam not found" }, { status: 404 });

    // 2. Calculate score
    let score = 0;
    exam.questions.forEach((question, index) => {
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
        userId: Number(userId),
        examId: Number(examId),
        score,
        passed,
        answers,
      },
    });

    // 4. If final exam passed, check for course completion
    if (exam.type === "FINAL" && passed) {
      // Calculate total course score (Module exams + Final exam)
      const moduleAttempts = await prisma.examAttempt.findMany({
        where: {
          userId: Number(userId),
          exam: {
            courseId: exam.courseId,
            type: "MODULE",
          },
          passed: true,
        },
        include: { exam: true },
      });

      // Get the best score for each module
      const moduleBestScores = new Map();
      moduleAttempts.forEach((att) => {
        const currentBest = moduleBestScores.get(att.examId) || 0;
        if (att.score > currentBest) {
          moduleBestScores.set(att.examId, att.score);
        }
      });

      let totalEarnedMarks = score; // Start with final exam score
      moduleBestScores.forEach((val) => {
        totalEarnedMarks += val;
      });

      const totalCoursePercentage = (totalEarnedMarks / 100) * 100; // Assuming total is 100

      if (totalCoursePercentage >= 70) {
        await prisma.enrollment.update({
          where: {
            userId_courseId: {
              userId: Number(userId),
              courseId: exam.courseId,
            },
          },
          data: {
            isCompleted: true,
            completedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ message: "Exam submitted", attempt, percentage, passed }, { status: 200 });
  } catch (error: any) {
    console.error("Submit Exam Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ GET EXAM DETAILS (For students taking the exam)
export async function GET(req: NextRequest) {
  try {
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

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

    // 2. Enforce Attempt Rules & Prerequisites
    const existingScore = await prisma.enrollmentExamScore.findUnique({
      where: {
        enrollmentId_examId: {
          enrollmentId: enrollment.id,
          examId: exam.id,
        },
      },
    });

    if (exam.type === "MODULE") {
      // Rule: Single attempt for module exams
      if (existingScore) {
        return NextResponse.json({ message: "Module exams can only be attempted once." }, { status: 403 });
      }

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
      // Rule: Final exam locked if already passed course
      if (existingScore?.locked) {
        return NextResponse.json({ message: "Final exam is locked. You have already passed the course." }, { status: 403 });
      }

      // Rule: All module exams must be taken before final exam
      const moduleExams = await prisma.exam.findMany({
        where: { courseId: exam.courseId, type: "MODULE" },
        select: { id: true },
      });
      const moduleScores = await prisma.enrollmentExamScore.findMany({
        where: {
          enrollmentId: enrollment.id,
          exam: { type: "MODULE", courseId: exam.courseId },
        },
        select: { examId: true },
      });
      const takenSet = new Set(moduleScores.map((s) => s.examId));
      const allModulesTaken = moduleExams.every((e) => takenSet.has(e.id));
      if (!allModulesTaken) {
        return NextResponse.json({ message: "Take all module exams before attempting the final exam" }, { status: 403 });
      }
    }

    // 3. Calculate raw score from questions
    let rawScore = 0;
    let maxRawScore = 0;
    exam.questions.forEach((question) => {
      maxRawScore += question.marks;
      // answers is expected to be an object: { questionId: selectedOptionIndex }
      if (question.correctOptions.includes(Number(answers[question.id]))) {
        rawScore += question.marks;
      }
    });

    const percentage = maxRawScore > 0 ? (rawScore / maxRawScore) * 100 : 0;
    
    // The final score earned is proportional to the admin-assigned totalMarks
    const score = maxRawScore > 0 ? Math.round((rawScore / maxRawScore) * exam.totalMarks * 100) / 100 : 0;

    const passed = percentage >= exam.passingMarks; // Individual exam pass status (less important for final total calculation)

    // 4. Save attempt
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

    // 5. Save stable score state
    if (exam.type === "MODULE") {
      // Module marks are permanently locked immediately after first attempt
      await prisma.enrollmentExamScore.upsert({
        where: {
          enrollmentId_examId: {
            enrollmentId: enrollment.id,
            examId: exam.id,
          },
        },
        update: {
          // Should not hit update since we block duplicate module attempts, but just in case
          earnedMarks: score,
          totalMarks: exam.totalMarks,
          passed,
          locked: true,
        },
        create: {
          enrollmentId: enrollment.id,
          examId: exam.id,
          earnedMarks: score,
          totalMarks: exam.totalMarks,
          passed,
          locked: true,
        },
      });
    } else {
      // Final exam can be retaken; keep best score. 
      // Do NOT lock here, we lock during course recomputation if Total >= 70
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

    // 6. Recompute course completion eligibility (Total Course Score >= 70)
    const stableScores = await prisma.enrollmentExamScore.findMany({
      where: {
        enrollmentId: enrollment.id,
        exam: { courseId: exam.courseId },
      },
      include: { exam: { select: { type: true } } },
    });
    
    const totalEarned = stableScores.reduce((sum, s) => sum + s.earnedMarks, 0);
    // Based on the 100-mark rule, the course total is always out of 100
    const totalPossible = 100;
    const finalScoreRecord = stableScores.find((s) => s.exam.type === "FINAL");
    
    // We base passing on total marks earned out of 100
    // Actually, percent can just be `totalEarned` if totalPossible is 100.
    const percent = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    
    // Pass course if they took final exam AND total percent >= 70
    const canComplete = Boolean(finalScoreRecord) && percent >= 70;

    if (canComplete) {
      // Lock the final exam because they passed the course
      if (finalScoreRecord) {
        await prisma.enrollmentExamScore.update({
          where: { id: finalScoreRecord.id },
          data: { locked: true, passed: true }
        });
      }

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { isCompleted: true, completedAt: enrollment.completedAt ?? new Date() },
      });
    } else {
      // Ensure it is not completed if they dropped below 70 (unlikely since we keep best score, but safe)
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { isCompleted: false, completedAt: null },
      });
    }

    return NextResponse.json(
      {
        message: canComplete ? "Congratulations! You passed the course." : "Exam submitted",
        attempt,
        percentage, // Exam percentage
        passed, // Exam passed
        totalEarned, // Total course score
        totalPossible, // Should be 100
        finalPercentage: totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0,
        coursePassed: canComplete
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

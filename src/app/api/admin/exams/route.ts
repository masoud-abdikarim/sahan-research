import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

const normalizeQuestions = (questions: any[]) => {
  return questions.map((q, idx) => {
    const options = [q.optionA, q.optionB, q.optionC, q.optionD].map((x) => String(x || "").trim());
    const validOptions = options.every(Boolean);
    const correctOption = Number(q.correctOption);
    const marks = Number(q.marks);

    if (!String(q.questionText || "").trim() || !validOptions || ![0, 1, 2, 3].includes(correctOption) || marks <= 0) {
      throw new Error(`Invalid question at position ${idx + 1}`);
    }

    return {
      type: "MULTIPLE_CHOICE" as const,
      questionText: String(q.questionText).trim(),
      options,
      correctOptions: [correctOption],
      marks,
    };
  });
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const type = searchParams.get("type");

    const exams = await prisma.exam.findMany({
      where: {
        courseId: courseId ? Number(courseId) : undefined,
        type: type === "MODULE" || type === "FINAL" ? type : undefined,
      },
      include: {
        module: true,
        course: { select: { id: true, name: true } },
        questions: { orderBy: { id: "asc" } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ exams });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// CREATE / UPDATE EXAM (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, type, totalMarks, passingMarks, courseId, moduleId, questions } = body;

    if (!title || !type || !courseId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ message: "Missing required exam fields" }, { status: 400 });
    }
    if (!["MODULE", "FINAL"].includes(type)) {
      return NextResponse.json({ message: "Exam type must be MODULE or FINAL" }, { status: 400 });
    }
    if (type === "MODULE" && !moduleId) {
      return NextResponse.json({ message: "Module exam requires moduleId" }, { status: 400 });
    }
    if (type === "FINAL" && moduleId) {
      return NextResponse.json({ message: "Final exam cannot be attached to module" }, { status: 400 });
    }

    const parsedQuestions = normalizeQuestions(questions);
    const computedTotal = parsedQuestions.reduce((sum, q) => sum + q.marks, 0);
    if (Number(totalMarks) !== computedTotal) {
      return NextResponse.json(
        { message: `Total marks mismatch. Expected ${computedTotal} from questions.` },
        { status: 400 }
      );
    }

    if (type === "MODULE") {
      const existingModuleExam = await prisma.exam.findFirst({
        where: {
          type: "MODULE",
          moduleId: Number(moduleId),
          NOT: id ? { id: Number(id) } : undefined,
        },
      });
      if (existingModuleExam) {
        return NextResponse.json({ message: "This module already has an exam" }, { status: 409 });
      }
    } else {
      const existingFinal = await prisma.exam.findFirst({
        where: {
          type: "FINAL",
          courseId: Number(courseId),
          NOT: id ? { id: Number(id) } : undefined,
        },
      });
      if (existingFinal) {
        return NextResponse.json({ message: "This course already has a final exam" }, { status: 409 });
      }
    }

    const examData = {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      type,
      totalMarks: Number(totalMarks),
      passingMarks: Number(passingMarks),
      courseId: Number(courseId),
      moduleId: moduleId ? Number(moduleId) : null,
    };

    let exam: any;
    if (id) {
      // Update existing exam
      exam = await prisma.exam.update({
        where: { id: Number(id) },
        data: examData,
      });

      await prisma.question.deleteMany({ where: { examId: exam.id } });
      await prisma.question.createMany({
        data: parsedQuestions.map((q) => ({ ...q, examId: exam.id })),
      });
    } else {
      // Create new exam
      exam = await prisma.exam.create({
        data: {
          ...examData,
          questions: {
            create: parsedQuestions,
          },
        },
      });
    }

    return NextResponse.json({ exam }, { status: id ? 200 : 201 });
  } catch (error: any) {
    console.error("Manage Exam Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ DELETE EXAM
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await prisma.exam.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Exam deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

// ✅ CREATE/UPDATE EXAM (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, type, totalMarks, passingMarks, courseId, moduleId, questions } = body;

    const examData = {
      title,
      description,
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

      // Simple question sync: delete old and create new
      if (questions) {
        await prisma.question.deleteMany({ where: { examId: exam.id } });
        await prisma.question.createMany({
          data: questions.map((q: any) => ({
            examId: exam.id,
            questionText: q.questionText,
            options: q.options,
            correctOption: Number(q.correctOption),
            marks: Number(q.marks),
          })),
        });
      }
    } else {
      // Create new exam
      exam = await prisma.exam.create({
        data: {
          ...examData,
          questions: {
            create: questions.map((q: any) => ({
              questionText: q.questionText,
              options: q.options,
              correctOption: Number(q.correctOption),
              marks: Number(q.marks),
            })),
          },
        },
      });
    }

    return NextResponse.json({ exam }, { status: 201 });
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

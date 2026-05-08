import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";

// ✅ GET COURSE CONTENT (For students)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = Number(id);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: { orderBy: { order: "asc" } },
            exam: {
              select: {
                id: true,
                title: true,
                type: true,
                totalMarks: true,
                passingMarks: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        exams: {
          where: { type: "FINAL" },
          select: {
            id: true,
            title: true,
            type: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
    });

    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });

    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

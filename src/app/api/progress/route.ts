import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";


// ✅ MARK LESSON AS COMPLETED
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enrollmentId, lessonId } = body;

    if (!enrollmentId || !lessonId) {
      return NextResponse.json(
        { message: "enrollmentId and lessonId are required" },
        { status: 400 }
      );
    }

    // check if already exists
    let progress = await prisma.progress.findFirst({
      where: {
        enrollmentId,
        lessonId,
      },
    });

    if (progress) {
      // update to completed
      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: { completed: true },
      });
    } else {
      // create new
      progress = await prisma.progress.create({
        data: {
          enrollmentId,
          lessonId,
          completed: true,
        },
      });
    }

    return NextResponse.json(
      { message: "Lesson marked as completed", progress },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
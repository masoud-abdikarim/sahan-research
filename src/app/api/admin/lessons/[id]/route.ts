import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const lessonId = Number(id);
    const order = Number(body.order);

    // 🔒 check if order already exists in this course for a DIFFERENT lesson
    const currentLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!currentLesson) return NextResponse.json({ message: "Lesson not found" }, { status: 404 });

    const existingOrder = await prisma.lesson.findFirst({
      where: {
        moduleId: currentLesson.moduleId,
        order,
        NOT: { id: lessonId }
      },
    });

    if (existingOrder) {
      return NextResponse.json(
        { message: `Lesson number ${order} already exists in this course.` },
        { status: 409 }
      );
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: body.title,
        order: order,
        videoType: body.videoType || null,
        videoUrl: body.videoUrl || null,
        audioUrls: body.audioUrls || undefined
      }
    });

    return NextResponse.json({ lesson: updatedLesson });
  } catch (error: any) {
    console.error("Update Lesson Error:", error);
    return NextResponse.json({ message: "Failed to update lesson", details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.$transaction([
      // 1. Delete progress associated with this lesson
      prisma.progress.deleteMany({
        where: { lessonId: Number(id) }
      }),
      // 2. Delete the lesson
      prisma.lesson.delete({
        where: { id: Number(id) }
      })
    ]);

    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error: any) {
    console.error("Delete Lesson Error:", error);
    return NextResponse.json({ message: "Failed to delete lesson", details: error.message }, { status: 500 });
  }
}

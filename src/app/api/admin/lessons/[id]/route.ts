import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updatedLesson = await prisma.lesson.update({
      where: { id: Number(id) },
      data: {
        title: body.title,
        order: Number(body.order),
        videoType: body.videoType,
        videoUrl: body.videoUrl
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
    if (!session || session.role !== "ADMIN") {
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

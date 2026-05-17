import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

// ✅ CREATE LESSON
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, videoType, videoUrl, audioUrl, moduleId } = body;

    if (!moduleId) {
      return NextResponse.json({ message: "Module ID is required" }, { status: 400 });
    }

    // Get the courseId for this module to ensure global course ordering
    const module = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      select: { courseId: true }
    });

    if (!module) {
      return NextResponse.json({ message: "Module not found" }, { status: 404 });
    }

    // Auto-generate global course-wide order: find the highest order in this course
    const lastLesson = await prisma.lesson.findFirst({
      where: { module: { courseId: module.courseId } },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (lastLesson?.order ?? 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        videoType: videoType || null,
        videoUrl: videoUrl || null,
        audioUrl: audioUrl || null,
        order: nextOrder,
        moduleId: Number(moduleId),
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ UPDATE LESSON
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, videoType, videoUrl, audioUrl, order, moduleId } = body;

    const lesson = await prisma.lesson.update({
      where: { id: Number(id) },
      data: {
        title,
        videoType: videoType || null,
        videoUrl: videoUrl || null,
        audioUrl: audioUrl === null ? null : (audioUrl || undefined),
        order: order ? Number(order) : undefined,
        moduleId: moduleId ? Number(moduleId) : undefined,
      },
    });


    return NextResponse.json({ lesson }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ DELETE LESSON
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await prisma.lesson.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Lesson deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

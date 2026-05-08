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
    const { title, videoType, videoUrl, order, moduleId } = body;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        videoType,
        videoUrl,
        order: Number(order),
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
    const { id, title, videoType, videoUrl, order, moduleId } = body;

    const lesson = await prisma.lesson.update({
      where: { id: Number(id) },
      data: {
        title,
        videoType,
        videoUrl,
        order: Number(order),
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

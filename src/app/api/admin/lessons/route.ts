import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        videoUrl: data.videoUrl,
        order: data.order,
        courseId: data.courseId,
      }
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create lesson" }, { status: 500 });
  }
}

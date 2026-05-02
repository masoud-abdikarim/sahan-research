import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";


// ✅ CREATE LESSON (ADD VIDEO)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, videoUrl, order, courseId } = body;

    if (!title || !videoUrl || order === undefined || !courseId) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // 🔒 check if order already exists in this course
    const existingOrder = await prisma.lesson.findFirst({
      where: {
        courseId,
        order,
      },
    });

    if (existingOrder) {
      return NextResponse.json(
        { message: "Lesson order already exists in this course" },
        { status: 409 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        videoUrl,
        order: Number(order),
        courseId,
      },
    });

    return NextResponse.json(
      { message: "Lesson created successfully", lesson },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}


// ✅ GET LESSONS BY COURSE
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { message: "courseId is required" },
        { status: 400 }
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        courseId: Number(courseId),
      },
      orderBy: {
        order: "asc", // 👈 important for correct sequence
      },
    });

    return NextResponse.json({ lessons }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
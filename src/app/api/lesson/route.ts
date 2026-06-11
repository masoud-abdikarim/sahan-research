import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";


// ✅ CREATE LESSON (ADD VIDEO)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, videoUrl, order, courseId, videoType } = body;

    // 🔒 CORE RULE: Lesson must have video content
    if (!title || !videoUrl || order === undefined || !courseId || !videoType) {
      return NextResponse.json(
        { message: "All fields are required, including a valid video." },
        { status: 400 }
      );
    }

    // Basic format validation for URL
    if (videoType === "URL" && !videoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com)\/.+$/)) {
      return NextResponse.json(
        { message: "Invalid video URL format. Please provide a valid instructional video link." },
        { status: 400 }
      );
    }

    // 🔒 check if order already exists in this course
    const existingOrder = await prisma.lesson.findFirst({
      where: {
        module: { courseId: Number(courseId) },
        order: Number(order),
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
        moduleId: body.moduleId ? Number(body.moduleId) : 0, // Fallback if moduleId is missing
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { message: "courseId is required" },
        { status: 400 }
      );
    }

    // 🔒 Security: Students must have an APPROVED enrollment to access lessons
    if (session.role === "USER") {
      const approvedEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId: Number(session.id),
          courseId: Number(courseId),
          status: "APPROVED",
        },
      });

      if (!approvedEnrollment) {
        return NextResponse.json(
          { message: "Access denied. Your enrollment must be approved before accessing lessons." },
          { status: 403 }
        );
      }
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: Number(courseId),
        },
      },
      orderBy: {
        order: "asc",
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
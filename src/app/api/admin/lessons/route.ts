import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    // 1. Authentication Check
    if (!session || session.role !== "ADMIN") {
      console.error("[LESSON_API] Unauthorized access attempt");
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Parse Request Body
    let body;
    const contentType = req.headers.get("content-type") || "";
    
    try {
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else {
        const formData = await req.formData();
        body = {
          title: formData.get("title"),
          order: formData.get("order"),
          courseId: formData.get("courseId"),
          videoType: formData.get("videoType"),
          videoUrl: formData.get("videoUrl"),
        };
      }
    } catch (e) {
      console.error("[LESSON_API] Body parsing failed:", e);
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    console.log("[LESSON_API] Request Body:", body);

    const { title, order, courseId, videoType, videoUrl } = body;

    // 3. Validation
    if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });
    if (order === undefined || order === null || order === "") return NextResponse.json({ message: "Order is required" }, { status: 400 });
    if (!courseId) return NextResponse.json({ message: "Course Selection is required" }, { status: 400 });
    if (!videoUrl) return NextResponse.json({ message: "Video source (URL or File) is required" }, { status: 400 });
    if (!["URL", "UPLOAD"].includes(videoType)) return NextResponse.json({ message: "Invalid Video Type" }, { status: 400 });

    // 4. Verify Course Exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId, 10) }
    });

    if (!course) {
      console.error("[LESSON_API] Course not found:", courseId);
      return NextResponse.json({ message: "Selected course does not exist" }, { status: 404 });
    }

    // 5. Create Lesson in Database
    const lesson = await prisma.lesson.create({
      data: {
        title: String(title),
        order: parseInt(String(order), 10),
        courseId: parseInt(String(courseId), 10),
        videoType: videoType as any,
        videoUrl: String(videoUrl),
      }
    });

    console.log("[LESSON_API] Success! Lesson created:", lesson.id);
    return NextResponse.json({ lesson });

  } catch (error: any) {
    console.error("[LESSON_API] Critical Error:", error);
    
    // Prisma Specific Error Handling
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "A lesson with this unique constraint already exists" }, { status: 409 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ message: "Foreign key constraint failed (invalid courseId)" }, { status: 400 });
    }

    return NextResponse.json({ 
      message: "Server Error: Could not create lesson", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = parseInt(searchParams.get("courseId") || "0", 10);

    if (!courseId) return NextResponse.json({ message: "Course ID required" }, { status: 400 });

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" }
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch lessons" }, { status: 500 });
  }
}

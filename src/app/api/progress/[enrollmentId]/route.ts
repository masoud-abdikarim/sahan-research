import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";


// ✅ GET NEXT AVAILABLE LESSON
export async function GET(
  req: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const enrollmentId = Number(params.enrollmentId);

    // get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
        progress: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "Enrollment not found" },
        { status: 404 }
      );
    }

    // 🔒 block if not approved
    if (enrollment.status !== "APPROVED") {
      return NextResponse.json(
        { message: "Not approved yet" },
        { status: 403 }
      );
    }

    const lessons = enrollment.course.lessons;
    const progress = enrollment.progress;

    // find first incomplete lesson
    let nextLesson = null;

    for (let lesson of lessons) {
      const done = progress.find(
        (p) => p.lessonId === lesson.id && p.completed
      );

      if (!done) {
        nextLesson = lesson;
        break;
      }
    }

    return NextResponse.json(
      {
        nextLesson,   // 👈 ONLY this lesson should be accessible
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { lessonId, courseId } = await req.json();

    if (!lessonId || !courseId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. Find Enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.id,
          courseId: Number(courseId)
        }
      }
    });

    if (!enrollment || enrollment.status !== "APPROVED") {
      return NextResponse.json({ message: "Valid enrollment required" }, { status: 403 });
    }

    // 2. Mark Progress (Upsert)
    const progress = await prisma.progress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: Number(lessonId)
        }
      },
      update: {
        completed: true
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: Number(lessonId),
        completed: true
      }
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[PROGRESS_UPDATE_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

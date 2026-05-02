import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) return NextResponse.json({ message: "enrollmentId required" }, { status: 400 });

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollmentId) },
      include: { course: true }
    });

    if (!enrollment || enrollment.userId !== session.id || enrollment.status !== "APPROVED") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Find progress
    const progress = await prisma.progress.findMany({
      where: { enrollmentId: Number(enrollmentId) },
      include: { lesson: true }
    });

    const completedLessonIds = progress.filter(p => p.completed).map(p => p.lessonId);

    // Find the next lesson
    const nextLesson = await prisma.lesson.findFirst({
      where: { 
        courseId: enrollment.courseId,
        id: { notIn: completedLessonIds }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ nextLesson });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { enrollmentId, lessonId } = await req.json();

    // Verify ownership
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(enrollmentId) }
    });

    if (!enrollment || enrollment.userId !== session.id || enrollment.status !== "APPROVED") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Here we should ideally check if the previous lesson was completed (Sequential Logic)
    const targetLesson = await prisma.lesson.findUnique({ where: { id: Number(lessonId) } });
    if (!targetLesson) return NextResponse.json({ message: "Lesson not found" }, { status: 404 });

    const previousLesson = await prisma.lesson.findFirst({
      where: { courseId: enrollment.courseId, order: { lt: targetLesson.order } },
      orderBy: { order: 'desc' }
    });

    if (previousLesson) {
      const prevProgress = await prisma.progress.findFirst({
        where: { enrollmentId: Number(enrollmentId), lessonId: previousLesson.id, completed: true }
      });
      if (!prevProgress) {
        return NextResponse.json({ message: "Complete previous lesson first" }, { status: 403 });
      }
    }

    const progress = await prisma.progress.create({
      data: {
        enrollmentId: Number(enrollmentId),
        lessonId: Number(lessonId),
        completed: true
      }
    });

    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update progress" }, { status: 500 });
  }
}

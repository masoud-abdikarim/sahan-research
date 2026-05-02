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

    const updatedCourse = await prisma.course.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        description: body.description,
        price: Number(body.price),
        durationMonths: Number(body.durationMonths),
        category: body.category,
        imageUrl: body.imageUrl
      }
    });

    return NextResponse.json({ course: updatedCourse });
  } catch (error: any) {
    console.error("Update Course Error:", error);
    return NextResponse.json({ 
      message: "Failed to update course", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
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
    const courseId = Number(id);

    // Perform a strict sequence of deletions
    await prisma.$transaction(async (tx) => {
      // 1. Get all lesson IDs for this course
      const lessons = await tx.lesson.findMany({
        where: { courseId: courseId },
        select: { id: true }
      });
      const lessonIds = lessons.map(l => l.id);

      // 2. Get all enrollment IDs for this course
      const enrollments = await tx.enrollment.findMany({
        where: { courseId: courseId },
        select: { id: true }
      });
      const enrollmentIds = enrollments.map(e => e.id);

      // 3. Delete Progress records using the IDs we found
      // This avoids the "Unknown argument courseId" error in deleteMany
      await tx.progress.deleteMany({
        where: {
          OR: [
            { lessonId: { in: lessonIds } },
            { enrollmentId: { in: enrollmentIds } }
          ]
        }
      });

      // 4. Delete Enrollments
      await tx.enrollment.deleteMany({
        where: { id: { in: enrollmentIds } }
      });

      // 5. Delete Lessons
      await tx.lesson.deleteMany({
        where: { id: { in: lessonIds } }
      });

      // 6. Finally delete the Course
      await tx.course.delete({
        where: { id: courseId }
      });
    });

    return NextResponse.json({ message: "Course and all related records deleted successfully" });
  } catch (error: any) {
    console.error("Delete Course Error:", error);
    return NextResponse.json({ 
      message: "Failed to delete course", 
      details: error.message 
    }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

// ✅ GET COURSE STRUCTURE (Admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: { orderBy: { order: "asc" } },
            exam: { include: { questions: true } },
          },
          orderBy: { order: "asc" },
        },
        exams: {
          where: { type: "FINAL" },
          include: { questions: true },
        },
      },
    });

    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ UPDATE COURSE (Basic Info)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updatedCourse = await prisma.course.update({
      where: { id: Number(id) },
      data: {
        name: body.name,
        description: body.description,
        outcomes: body.outcomes,
        instructor: body.instructor,
        price: Number(body.price),
        durationMonths: Number(body.durationMonths),
        level: body.level,
        totalHours: body.totalHours ? Number(body.totalHours) : 0,
        whoIsFor: body.whoIsFor,
        prerequisites: body.prerequisites,
        lastUpdated: new Date(),
        category: body.category,
        imageUrl: body.imageUrl,
        previewVideoType: body.previewVideoType || null,
        previewVideoUrl: body.previewVideoUrl || null,
      }
    });

    return NextResponse.json({ course: updatedCourse });
  } catch (error: any) {
    console.error("Update Course Error:", error);
    return NextResponse.json({ 
      message: "Failed to update course", 
      details: error.message,
    }, { status: 500 });
  }
}

// ✅ DELETE COURSE (Full Cleanup)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const courseId = Number(id);

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ message: "Course and all related records deleted successfully" });
  } catch (error: any) {
    console.error("Delete Course Error:", error);
    return NextResponse.json({ message: "Failed to delete course", error: error.message }, { status: 500 });
  }
}

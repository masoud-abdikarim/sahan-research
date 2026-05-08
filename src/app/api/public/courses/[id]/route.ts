import { NextResponse } from "next/server";
import prisma from "@/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = Number(id);

    if (isNaN(courseId)) {
      return NextResponse.json({ message: "Invalid Course ID" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        description: true,
        outcomes: true,
        instructor: true,
        price: true,
        durationMonths: true,
        level: true,
        totalHours: true,
        whoIsFor: true,
        prerequisites: true,
        lastUpdated: true,
        category: true,
        imageUrl: true,
        modules: {
          include: {
            lessons: { 
              select: {
                id: true,
                title: true,
                order: true,
                // specifically NOT returning videoUrl or other private content
              },
              orderBy: { order: "asc" } 
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error("Public Course Detail Error:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  }
}

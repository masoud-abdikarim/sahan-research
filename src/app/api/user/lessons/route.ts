import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) return NextResponse.json({ message: "Course ID required" }, { status: 400 });

    // Validate enrollment is APPROVED
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.id, courseId: Number(courseId) } }
    });

    if (!enrollment || enrollment.status !== "APPROVED") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId: Number(courseId) },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

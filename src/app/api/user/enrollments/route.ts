import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.id },
      include: { course: true }
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { courseId } = await req.json();

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.id,
        courseId: Number(courseId),
        status: "PENDING",
      }
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    return NextResponse.json({ message: "Failed to enroll" }, { status: 500 });
  }
}

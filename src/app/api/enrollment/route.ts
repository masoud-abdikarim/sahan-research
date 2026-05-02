import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";


// ✅ ENROLL IN COURSE (STUDENT)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { message: "userId and courseId are required" },
        { status: 400 }
      );
    }

    // 🔒 prevent duplicate enrollment
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Already enrolled" },
        { status: 409 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    return NextResponse.json(
      { message: "Enrollment request sent", enrollment },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}


// ✅ GET USER ENROLLMENTS
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: Number(userId),
      },
      include: {
        course: true,
      },
    });

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
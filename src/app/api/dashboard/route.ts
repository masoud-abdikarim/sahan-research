import { NextResponse } from "next/server";
import prisma from "@/prisma";

export async function GET() {
  try {
    const [totalCourses, activeEnrollments, lessonsCompleted] = await Promise.all([
      prisma.course.count(),
      prisma.enrollment.count({
        where: { status: "APPROVED" },
      }),
      prisma.progress.count({
        where: { completed: true },
      }),
    ]);

    return NextResponse.json({
      totalCourses,
      activeEnrollments,
      lessonsCompleted,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const totalCourses = await prisma.course.count();
    const totalUsers = await prisma.user.count();
    const pendingEnrollments = await prisma.enrollment.count({
      where: { status: "PENDING" }
    });
    
    // Sum of price for all APPROVED enrollments
    const approvedEnrollments = await prisma.enrollment.findMany({
      where: { status: "APPROVED" },
      include: { course: true }
    });
    
    const totalRevenue = approvedEnrollments.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);

    console.log("[STATS_API] Calculated stats:", { totalCourses, totalUsers, pendingEnrollments, totalRevenue });

    return NextResponse.json({
      stats: {
        totalCourses,
        totalUsers,
        pendingEnrollments,
        totalRevenue
      }
    });
  } catch (error: any) {
    console.error("[STATS_API_ERROR]", error.message || error);
    return NextResponse.json({ 
      message: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  }
}

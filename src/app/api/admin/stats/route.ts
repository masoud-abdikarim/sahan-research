import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    console.log("[STATS_API] Session:", session);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let totalCourses = 0;
    let totalUsers = 0;
    let pendingEnrollments = 0;
    let totalRevenue = 0;

    try {
      totalCourses = await prisma.course.count();
      totalUsers = await prisma.user.count({ where: { role: "USER" } });
      
      pendingEnrollments = await prisma.enrollment.count({
        where: { 
          status: "PENDING",
          user: { role: "USER" }
        }
      });
      
      const approvedEnrollments = await prisma.enrollment.findMany({
        where: { 
          status: "APPROVED",
          user: { role: "USER" }
        },
        include: { course: true }
      });
      
      totalRevenue = approvedEnrollments.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);
    } catch (dbError: any) {
      console.error("[STATS_API_DB_ERROR]", dbError.message || dbError);
      // Continue with whatever stats we got, or throw if critical
    }

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

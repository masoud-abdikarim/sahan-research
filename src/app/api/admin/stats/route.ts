import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let totalCourses = 0;
    let totalUsers = 0;
    let pendingEnrollments = 0;
    let totalRevenue = 0;
    
    // Advanced Analytics
    let studentsPassed = 0;
    let studentsFailed = 0;
    let studentsStudying = 0;
    let completedModules = 0;
    let certRequests = 0;
    let averageMarks = 0;

    try {
      totalCourses = await prisma.course.count();
      totalUsers = await prisma.user.count({ where: { role: "USER" } });
      
      pendingEnrollments = await prisma.enrollment.count({
        where: { status: "PENDING", user: { role: "USER" } }
      });
      
      const approvedEnrollments = await prisma.enrollment.findMany({
        where: { status: "APPROVED", user: { role: "USER" } },
        include: { 
          course: true,
          examScores: { include: { exam: true } }
        }
      });
      
      totalRevenue = approvedEnrollments.reduce((acc, curr) => acc + (curr.course?.price || 0), 0);
      
      let totalEarnedPlatformWide = 0;
      let totalPossiblePlatformWide = 0;

      for (const enr of approvedEnrollments) {
        if (enr.isCompleted) {
          studentsPassed++;
        } else {
          // Check if they took the final exam and failed, otherwise they are studying
          const tookFinal = enr.examScores.some(s => s.exam.type === "FINAL");
          if (tookFinal) {
            studentsFailed++;
          } else {
            studentsStudying++;
          }
        }

        const modScores = enr.examScores.filter(s => s.exam.type === "MODULE");
        completedModules += modScores.length;

        // For average marks, sum everything up
        totalEarnedPlatformWide += enr.examScores.reduce((sum, s) => sum + s.earnedMarks, 0);
        totalPossiblePlatformWide += enr.examScores.reduce((sum, s) => sum + s.totalMarks, 0);
      }

      averageMarks = totalPossiblePlatformWide > 0 ? Math.round((totalEarnedPlatformWide / totalPossiblePlatformWide) * 100) : 0;
      certRequests = await prisma.certificate.count();

    } catch (dbError: any) {
      console.error("[STATS_API_DB_ERROR]", dbError.message || dbError);
    }

    return NextResponse.json({
      stats: {
        totalCourses,
        totalUsers,
        pendingEnrollments,
        totalRevenue,
        studentsPassed,
        studentsFailed,
        studentsStudying,
        completedModules,
        certRequests,
        averageMarks
      }
    });
  } catch (error: any) {
    console.error("[STATS_API_ERROR]", error.message || error);
    return NextResponse.json({ message: "Internal server error", details: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch all courses with their approved enrollments that are already marked COMPLETED
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          where: { 
            status: "APPROVED",
            isCompleted: true // 🔒 CORE RULE: Trust the permanent snapshot only
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    // Process data using the permanent completion record
    const completionData = courses.map((course) => {
      const completedStudents = course.enrollments.map(enrollment => {
        return {
          studentId: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          phone: enrollment.user.phone,
          completionDate: enrollment.completedAt || enrollment.createdAt,
          progressStatus: 100,
        };
      });

      return {
        courseId: course.id,
        courseName: course.name,
        durationMonths: course.durationMonths,
        totalCompleted: completedStudents.length,
        lastUpdated: completedStudents.length > 0 ? completedStudents[0].completionDate : null,
        students: completedStudents
      };
    });

    console.log(`[ADMIN_HISTORY] Fetched ${completionData.length} courses from permanent completion records`);

    console.log(`[ADMIN_HISTORY] Fetched ${completionData.length} courses with completion data`);

    return NextResponse.json({ completionData });
  } catch (error: any) {
    console.error("Course Completion History API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

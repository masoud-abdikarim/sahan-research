import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch all courses with their approved enrollments and lessons
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { lessons: true }
        },
        enrollments: {
          where: { status: "APPROVED" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            },
            _count: {
              select: { progress: true }
            }
          }
        }
      }
    });

    // Process data and perform reconciliation for missed completions
    const completionData = await Promise.all(courses.map(async (course) => {
      const totalLessons = course._count.lessons;
      
      const completedStudents = [];

      for (const enrollment of course.enrollments) {
        const completedLessons = enrollment._count.progress;
        const isActuallyDone = totalLessons > 0 && completedLessons === totalLessons;

        if (isActuallyDone) {
          // 🔄 Auto-fix if record was missed in DB
          if (!enrollment.isCompleted) {
            await prisma.enrollment.update({
              where: { id: enrollment.id },
              data: {
                isCompleted: true,
                completedAt: new Date(),
                totalLessonsAtTimeOfCompletion: totalLessons
              }
            });
          }

          completedStudents.push({
            studentId: enrollment.user.id,
            name: enrollment.user.name,
            email: enrollment.user.email,
            phone: enrollment.user.phone,
            completionDate: enrollment.completedAt || enrollment.createdAt,
            progressStatus: 100,
          });
        }
      }

      return {
        courseId: course.id,
        courseName: course.name,
        durationMonths: course.durationMonths,
        totalCompleted: completedStudents.length,
        lastUpdated: completedStudents.length > 0 ? completedStudents[0].completionDate : null,
        students: completedStudents
      };
    }));

    console.log(`[ADMIN_HISTORY] Fetched ${completionData.length} courses with completion data`);

    return NextResponse.json({ completionData });
  } catch (error: any) {
    console.error("Course Completion History API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

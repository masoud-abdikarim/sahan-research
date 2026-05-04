import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.id },
      include: { 
        course: {
          include: {
            _count: {
              select: { lessons: true }
            }
          }
        },
        _count: {
          select: { progress: true }
        }
      }
    });

    // Transform to include percentage and counts directly
    const transformedEnrollments = await Promise.all(enrollments.map(async (e) => {
      const totalLessons = e.course._count.lessons;
      const completedLessons = e._count.progress;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      // 🔄 Reconciliation: If calculation says completed but DB says false, update DB
      const calculatedCompletion = totalLessons > 0 && completedLessons === totalLessons;
      
      if (calculatedCompletion && !e.isCompleted) {
        await prisma.enrollment.update({
          where: { id: e.id },
          data: {
            isCompleted: true,
            completedAt: new Date(),
            totalLessonsAtTimeOfCompletion: totalLessons
          }
        });
        e.isCompleted = true; // Update local object for response
      }

      return {
        ...e,
        totalLessons,
        completedLessons,
        progressPercentage,
      };
    }));

    return NextResponse.json({ enrollments: transformedEnrollments });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // 🔒 Security: Block ADMIN from enrolling
    if (session.role === "ADMIN") {
      return NextResponse.json({ 
        message: "Admin accounts cannot enroll in courses. Enrollment is reserved for students only." 
      }, { status: 403 });
    }

    const { courseId } = await req.json();

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.id,
          courseId: Number(courseId)
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ 
        message: "You are already enrolled in this course." 
      }, { status: 400 });
    }

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

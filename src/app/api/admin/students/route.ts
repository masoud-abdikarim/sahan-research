import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const students = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        enrollments: {
          where: { status: "APPROVED" },
          include: {
            course: {
              select: { id: true, name: true, modules: { select: { id: true } } }
            },
            examScores: {
              include: {
                exam: { select: { id: true, title: true, type: true } }
              }
            }
          }
        },
        certificates: {
          select: { courseId: true, status: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const flattenedStudents: any[] = [];

    students.forEach(student => {
      if (student.enrollments.length === 0) {
        // If a student is registered but not enrolled, we still want to show them
        flattenedStudents.push({
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          avatar: null,
          enrollmentId: null,
          courseName: "No Course",
          moduleCount: 0,
          completedModules: 0,
          moduleMarks: [],
          finalExamMark: "N/A",
          totalMarks: "0/0",
          progressPercentage: 0,
          graduationStatus: "NOT ENROLLED",
          certificateStatus: "No Request",
          enrollmentYear: null,
          graduationDate: null,
          courseId: null
        });
        return;
      }

      student.enrollments.forEach((enrollment: any) => {
        const moduleScores = enrollment.examScores.filter((s: any) => s.exam.type === "MODULE");
        const finalScore = enrollment.examScores.find((s: any) => s.exam.type === "FINAL");

        const totalEarned = enrollment.examScores.reduce((sum: number, s: any) => sum + s.earnedMarks, 0);
        const accumulatedPossible = enrollment.examScores.reduce((sum: number, s: any) => sum + s.totalMarks, 0);
        
        const cert = student.certificates.find((c: any) => c.courseId === enrollment.courseId);
        
        const certificateEligibility = enrollment.isCompleted && totalEarned >= 70;
        
        // Graduation Status Logic
        let graduationStatus = "PRESENT";
        if (cert?.status === "APPROVED") {
          // Note: APPROVED implies ISSUED
          graduationStatus = "CERTIFIED";
        } else if (enrollment.isCompleted) {
          graduationStatus = "GRADUATED";
        } else if (finalScore) {
          graduationStatus = "FAILED";
        }

        // Dynamic Marks Logic
        let displayTotalMarks = "";
        if (graduationStatus === "PRESENT" || graduationStatus === "FAILED") {
          displayTotalMarks = `${totalEarned}/${accumulatedPossible}`;
        } else {
          displayTotalMarks = `${totalEarned}/100`;
        }

        const certStatusDisplay = cert ? cert.status : (certificateEligibility ? "ELIGIBLE" : "LOCKED");

        flattenedStudents.push({
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          avatar: null,
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          courseName: enrollment.course.name,
          moduleCount: enrollment.course.modules.length,
          completedModules: moduleScores.length,
          moduleMarks: moduleScores.map((m: any) => ({ title: m.exam.title, earned: m.earnedMarks, total: m.totalMarks })),
          finalExamMark: finalScore ? `${finalScore.earnedMarks}/${finalScore.totalMarks}` : "Not Taken",
          totalMarks: displayTotalMarks,
          progressPercentage: accumulatedPossible > 0 ? Math.round((totalEarned / accumulatedPossible) * 100) : 0,
          graduationStatus,
          certificateStatus: cert?.status === "APPROVED" ? "ISSUED" : certStatusDisplay,
          enrollmentYear: new Date((enrollment as any).createdAt || new Date()).getFullYear().toString(),
          graduationDate: enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : null
        });
      });
    });

    return NextResponse.json({ students: flattenedStudents });
  } catch (error: any) {
    console.error("Admin Students Route Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

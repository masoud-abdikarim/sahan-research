import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get("enrollmentId");

    const resolvedParams = await params;
    const studentId = Number(resolvedParams.id);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        role: true,
      }
    });

    if (!student || student.role !== "USER") {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentId,
        ...(enrollmentId ? { id: Number(enrollmentId) } : {})
      },
      include: {
        course: {
          select: { id: true, name: true, modules: { select: { id: true } } }
        },
        progress: {
          where: { completed: true },
          include: { lesson: { select: { id: true, title: true } } }
        },
        examScores: {
          include: {
            exam: { select: { id: true, title: true, type: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        examAttempts: {
          select: { id: true, examId: true, score: true, passed: true, createdAt: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    const certificates = await prisma.certificate.findMany({
      where: { userId: studentId }
    });

    const detailedEnrollments = enrollments.map(enrollment => {
      const moduleScores = enrollment.examScores.filter(s => s.exam.type === "MODULE");
      const finalScore = enrollment.examScores.find(s => s.exam.type === "FINAL");

      const totalEarned = enrollment.examScores.reduce((sum, s) => sum + s.earnedMarks, 0);
      const accumulatedPossible = enrollment.examScores.reduce((sum, s) => sum + s.totalMarks, 0);
      
      const cert = certificates.find(c => c.courseId === enrollment.courseId);
      const certificateEligibility = enrollment.isCompleted && totalEarned >= 70;
      
      let graduationStatus = "PRESENT";
      if (cert?.status === "APPROVED") {
        graduationStatus = "CERTIFIED";
      } else if (enrollment.isCompleted) {
        graduationStatus = "GRADUATED";
      } else if (finalScore) {
        graduationStatus = "FAILED";
      }

      let displayTotalMarks = "";
      if (graduationStatus === "PRESENT" || graduationStatus === "FAILED") {
        displayTotalMarks = `${totalEarned}/${accumulatedPossible}`;
      } else {
        displayTotalMarks = `${totalEarned}/100`;
      }

      const certStatusDisplay = cert?.status === "APPROVED" ? "ISSUED" : (cert ? cert.status : (certificateEligibility ? "ELIGIBLE" : "LOCKED"));

      const finalAttempts = enrollment.examAttempts.filter(a => finalScore && a.examId === finalScore.examId);

      return {
        enrollmentId: enrollment.id,
        courseName: enrollment.course.name,
        enrollmentDate: enrollment.createdAt,
        status: enrollment.status,
        graduationStatus,
        certificateStatus: certStatusDisplay,
        graduationDate: enrollment.completedAt,
        totalMarks: displayTotalMarks,
        progressPercentage: accumulatedPossible > 0 ? Math.round((totalEarned / accumulatedPossible) * 100) : 0,
        lessonsCompletedCount: enrollment.progress.length,
        modulesCount: enrollment.course.modules.length,
        moduleExams: moduleScores.map(ms => ({
          id: ms.exam.id,
          title: ms.exam.title,
          earnedMarks: ms.earnedMarks,
          totalMarks: ms.totalMarks,
          locked: ms.locked,
          date: ms.createdAt,
          attempt: enrollment.examAttempts.find(a => a.examId === ms.exam.id) || null
        })),
        finalExam: finalScore ? {
          id: finalScore.exam.id,
          title: finalScore.exam.title,
          earnedMarks: finalScore.earnedMarks,
          totalMarks: finalScore.totalMarks,
          locked: finalScore.locked,
          attemptsCount: finalAttempts.length,
          attemptsHistory: finalAttempts
        } : null
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        avatar: null,
        joinedAt: student.createdAt,
      },
      enrollments: detailedEnrollments
    });
  } catch (error: any) {
    console.error("Admin Student Details Route Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

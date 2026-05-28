import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

// ✅ REQUEST CERTIFICATE
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ message: "courseId is required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: Number(session.id),
          courseId: Number(courseId),
        },
      },
    });
    if (!enrollment || enrollment.status !== "APPROVED") {
      return NextResponse.json({ message: "Approved enrollment required" }, { status: 403 });
    }

    // 1. Verify eligibility from stable enrollment scores
    const scores = await prisma.enrollmentExamScore.findMany({
      where: {
        enrollmentId: enrollment.id,
        exam: { courseId: Number(courseId) },
      },
      include: { exam: { select: { type: true } } },
    });

    const totalEarned = scores.reduce((sum, s) => sum + s.earnedMarks, 0);
    const totalPossible = scores.reduce((sum, s) => sum + s.totalMarks, 0);
    const finalPassed = scores.some((s) => s.exam.type === "FINAL" && s.passed);
    const totalPercent = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

    if (!finalPassed || totalPercent < 70) {
      return NextResponse.json(
        { message: "Not eligible. Need 70+ total and a passed final exam.", totalMarks: totalEarned, totalPercent },
        { status: 403 }
      );
    }

    // 2. Create request
    const certificate = await prisma.certificate.upsert({
      where: {
        userId_courseId: {
          userId: Number(session.id),
          courseId: Number(courseId),
        },
      },
      update: { status: "PENDING" },
      create: {
        userId: Number(session.id),
        courseId: Number(courseId),
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "Certificate requested successfully", certificate }, { status: 200 });
  } catch (error: any) {
    console.error("Certificate Request Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ GET CERTIFICATES (Admin views all, User views their own)
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // If not admin, they can only see their own certificates
    let targetUserId: number | null = userId ? parseInt(userId) : null;
    
    if ((session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      targetUserId = Number(session.id);
    }

    if (targetUserId && isNaN(targetUserId)) {
       return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
    }

    const where = targetUserId ? { userId: targetUserId } : {};

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = await Promise.all(
      certificates.map(async (cert) => {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: cert.userId,
              courseId: cert.courseId,
            },
          },
          select: { id: true },
        });
        if (!enrollment) return { ...cert, result: null };

        const scores = await prisma.enrollmentExamScore.findMany({
          where: { enrollmentId: enrollment.id },
          include: { exam: { select: { type: true, title: true } } },
        });
        const totalEarned = scores.reduce((sum, s) => sum + s.earnedMarks, 0);
        const totalPossible = scores.reduce((sum, s) => sum + s.totalMarks, 0);
        const moduleItems = scores.filter((s) => s.exam.type === "MODULE");
        const finalItem = scores.find((s) => s.exam.type === "FINAL");

        return {
          ...cert,
          result: {
            moduleEarned: moduleItems.reduce((sum, s) => sum + s.earnedMarks, 0),
            moduleTotal: moduleItems.reduce((sum, s) => sum + s.totalMarks, 0),
            finalEarned: finalItem?.earnedMarks ?? 0,
            finalTotal: finalItem?.totalMarks ?? 0,
            totalEarned,
            totalPossible,
            percent: totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0,
          },
        };
      })
    );

    let eligibleCourses: any[] = [];
    if (targetUserId) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: targetUserId,
          status: "APPROVED"
        },
        include: {
          course: { select: { id: true, name: true } },
          examScores: {
            include: { exam: { select: { type: true } } }
          }
        }
      });

      for (const en of enrollments) {
        const hasCert = certificates.some(c => c.courseId === en.courseId);
        if (!hasCert) {
          const totalEarned = en.examScores.reduce((sum, s) => sum + s.earnedMarks, 0);
          const totalPossible = en.examScores.reduce((sum, s) => sum + s.totalMarks, 0);
          const finalPassed = en.examScores.some((s) => s.exam.type === "FINAL" && s.passed);
          const totalPercent = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
          
          if (finalPassed && totalPercent >= 70) {
            eligibleCourses.push({
              courseId: en.courseId,
              courseName: en.course.name,
              totalPercent,
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      certificates: enriched || [],
      eligibleCourses
    });
  } catch (error: any) {
    console.error("GET Certificates Error:", error);
    return NextResponse.json({ 
      message: "Failed to fetch certificates", 
      error: error.message || "Unknown error",
      details: error.stack
    }, { status: 500 });
  }
}

// ✅ APPROVE/REJECT CERTIFICATE (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { certificateId, status, pdfUrl, rejectionReason } = body;

    if (!certificateId || !status) {
      return NextResponse.json({ message: "certificateId and status are required" }, { status: 400 });
    }

    const certificate = await prisma.certificate.update({
      where: { id: Number(certificateId) },
      data: {
        status,
        pdfUrl,
        rejectionReason: status === "REJECTED" ? (rejectionReason || null) : null,
        issueDate: status === "APPROVED" ? new Date() : null,
      },
    });

    return NextResponse.json({ message: `Certificate ${status.toLowerCase()} successfully`, certificate }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

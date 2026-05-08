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
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ message: "userId and courseId are required" }, { status: 400 });
    }

    // 1. Verify eligibility (Total marks >= 70)
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        userId: Number(userId),
        exam: { courseId: Number(courseId) },
        passed: true,
      },
      include: { exam: true },
    });

    // Get best score for each unique exam
    const bestScores = new Map();
    examAttempts.forEach((att) => {
      const currentBest = bestScores.get(att.examId) || 0;
      if (att.score > currentBest) bestScores.set(att.examId, att.score);
    });

    let totalMarks = 0;
    bestScores.forEach((score) => (totalMarks += score));

    if (totalMarks < 70) {
      return NextResponse.json(
        { message: "Not eligible for certificate. Total marks must be 70 or higher.", totalMarks },
        { status: 403 }
      );
    }

    // 2. Create request
    const certificate = await prisma.certificate.upsert({
      where: {
        userId_courseId: {
          userId: Number(userId),
          courseId: Number(courseId),
        },
      },
      update: { status: "PENDING" },
      create: {
        userId: Number(userId),
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
    
    if (session.role !== "ADMIN") {
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
        course: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      certificates: certificates || [] 
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
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { certificateId, status, pdfUrl } = body;

    if (!certificateId || !status) {
      return NextResponse.json({ message: "certificateId and status are required" }, { status: 400 });
    }

    const certificate = await prisma.certificate.update({
      where: { id: Number(certificateId) },
      data: {
        status,
        pdfUrl,
        issueDate: status === "APPROVED" ? new Date() : null,
      },
    });

    return NextResponse.json({ message: `Certificate ${status.toLowerCase()} successfully`, certificate }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const studentId = Number(resolvedParams.id);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true }
    });

    if (!student || student.role !== "USER") {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const data = await req.json();
    const { name, email, phone, password, academicStatus, courseId } = data;

    if (!name || !email || !phone) {
      return NextResponse.json({ message: "Name, email, and phone are required" }, { status: 400 });
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: studentId }
      }
    });
    if (existingEmail) {
      return NextResponse.json({ message: "Email is already in use by another user" }, { status: 400 });
    }

    // Check phone uniqueness
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: studentId }
      }
    });
    if (existingPhone) {
      return NextResponse.json({ message: "Phone number is already in use by another user" }, { status: 400 });
    }

    const userUpdateData: any = {
      name,
      email,
      phone,
    };

    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update basic user details
      await tx.user.update({
        where: { id: studentId },
        data: userUpdateData
      });

      // 2. Handle course enrollment and academic status
      const currentEnrollment = await tx.enrollment.findFirst({
        where: { userId: studentId }
      });

      const selectedCourseId = courseId ? Number(courseId) : null;

      if (selectedCourseId) {
        if (currentEnrollment) {
          if (currentEnrollment.courseId !== selectedCourseId) {
            // Course transfer: delete old enrollment and create a new one
            await tx.enrollment.delete({
              where: { id: currentEnrollment.id }
            });

            await tx.enrollment.create({
              data: {
                userId: studentId,
                courseId: selectedCourseId,
                status: "APPROVED",
                isCompleted: academicStatus === "GRADUATED",
                completedAt: academicStatus === "GRADUATED" ? new Date() : null
              }
            });
          } else {
            // Same course: update academic status on existing enrollment
            const isCompleted = academicStatus === "GRADUATED";
            await tx.enrollment.update({
              where: { id: currentEnrollment.id },
              data: {
                isCompleted,
                completedAt: isCompleted ? (currentEnrollment.completedAt || new Date()) : null
              }
            });
          }
        } else {
          // No current enrollment: create new enrollment
          await tx.enrollment.create({
            data: {
              userId: studentId,
              courseId: selectedCourseId,
              status: "APPROVED",
              isCompleted: academicStatus === "GRADUATED",
              completedAt: academicStatus === "GRADUATED" ? new Date() : null
            }
          });
        }
      } else {
        // courseId is explicitly removed or "No Course"
        if (currentEnrollment) {
          await tx.enrollment.delete({
            where: { id: currentEnrollment.id }
          });
        }
      }
    });

    return NextResponse.json({ message: "Student updated successfully" });
  } catch (error: any) {
    console.error("Update Student Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const studentId = Number(resolvedParams.id);

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true }
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    if (student.role !== "USER") {
      return NextResponse.json({ message: "Cannot delete non-student accounts" }, { status: 400 });
    }

    // Run in transaction to safely clean up all student's data
    await prisma.$transaction(async (tx) => {
      // 1. Delete all enrollments of the student (this cascades to progress, exam scores, and exam attempts linked to enrollments)
      await tx.enrollment.deleteMany({
        where: { userId: studentId }
      });

      // 2. Delete any certificates of the student
      await tx.certificate.deleteMany({
        where: { userId: studentId }
      });

      // 3. Delete any standalone exam attempts of the student
      await tx.examAttempt.deleteMany({
        where: { userId: studentId }
      });

      // 4. Finally, delete the student user
      await tx.user.delete({
        where: { id: studentId }
      });
    });

    return NextResponse.json({ message: "Student successfully removed from system" });
  } catch (error: any) {
    console.error("Delete Student Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}


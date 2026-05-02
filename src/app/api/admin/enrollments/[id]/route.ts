import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: any }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Await params for Next.js 15+ stability
    const { id } = await params;
    const enrollmentId = Number(id);

    if (isNaN(enrollmentId)) {
      return NextResponse.json({ message: "Invalid Enrollment ID" }, { status: 400 });
    }

    const { status } = await req.json();
    
    // Validate status enum
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    // Check if exists first
    const existing = await prisma.enrollment.findUnique({
      where: { id: enrollmentId }
    });

    if (!existing) {
      return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
      include: { 
        course: true, 
        user: { select: { name: true, email: true, phone: true } } 
      }
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("Enrollment Update Error:", error);
    return NextResponse.json({ message: "Failed to update enrollment" }, { status: 500 });
  }
}

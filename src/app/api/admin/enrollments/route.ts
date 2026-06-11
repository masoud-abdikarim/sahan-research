import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if ((session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Only return enrollments where the user still exists (guards against orphaned records from student deletion)
    const existingUserIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: { in: existingUserIds } },
      include: { course: true, user: { select: { name: true, email: true, phone: true } } }
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

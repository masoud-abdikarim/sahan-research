import { NextResponse } from "next/server";
import prisma from "@/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        durationMonths: true,
        category: true,
        createdAt: true,
        // specifically NOT returning userId (admin's id) or internal enrollment details
      }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Public Courses Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

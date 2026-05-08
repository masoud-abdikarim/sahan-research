import { NextResponse } from "next/server";
import prisma from "@/prisma";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not defined in environment variables");
      return NextResponse.json({ message: "Configuration error" }, { status: 500 });
    }

    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        outcomes: true,
        instructor: true,
        price: true,
        durationMonths: true,
        level: true,
        totalHours: true,
        whoIsFor: true,
        prerequisites: true,
        lastUpdated: true,
        category: true,
        imageUrl: true,
        createdAt: true,
        // specifically NOT returning userId (admin's id) or internal enrollment details
      }
    });

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("Public Courses Error:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

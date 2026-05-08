import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    
    // Validate inputs
    if (!data.name || !data.description || data.price === undefined || data.durationMonths === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const price = Number(data.price);
    const durationMonths = Number(data.durationMonths);

    if (isNaN(price) || isNaN(durationMonths)) {
      return NextResponse.json({ message: "Price and Duration must be valid numbers" }, { status: 400 });
    }

    console.log("Creating course with data:", {
      ...data,
      userId: session.id
    });

    const course = await prisma.course.create({
      data: {
        name: data.name,
        description: data.description,
        outcomes: Array.isArray(data.outcomes) ? data.outcomes : [],
        instructor: data.instructor || null,
        price: price,
        durationMonths: durationMonths,
        level: data.level || "All Levels",
        totalHours: data.totalHours ? Number(data.totalHours) : 0,
        whoIsFor: Array.isArray(data.whoIsFor) ? data.whoIsFor : [],
        prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
        category: data.category || "Uncategorized",
        imageUrl: data.imageUrl || null,
        userId: Number(session.id),
      }
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    console.error("Course Creation Error Details:", {
      message: error.message,
      stack: error.stack,
      code: error.code, // Prisma error code
      meta: error.meta  // Prisma error metadata
    });
    return NextResponse.json({ 
      message: "Failed to create course", 
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}

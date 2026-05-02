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

    const course = await prisma.course.create({
      data: {
        name: data.name,
        description: data.description,
        price: price,
        durationMonths: durationMonths,
        category: data.category || "Uncategorized",
        userId: Number(session.id), // Ensure it's a number
      }
    });

    return NextResponse.json({ course });
  } catch (error: any) {
    console.error("Course Creation Error:", error);
    return NextResponse.json({ 
      message: "Failed to create course", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

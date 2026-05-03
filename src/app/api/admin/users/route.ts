import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Users API Error:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

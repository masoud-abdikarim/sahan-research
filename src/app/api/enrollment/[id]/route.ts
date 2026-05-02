import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";


// ✅ APPROVE / REJECT ENROLLMENT (ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { message: "status is required" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.update({
      where: {
        id: Number(params.id),
      },
      data: {
        status, // APPROVED | REJECTED
      },
    });

    return NextResponse.json(
      { message: "Enrollment updated", enrollment },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

// ✅ CREATE MODULE
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, order, courseId } = body;

    // Check for existing module with same title in same course
    const existing = await prisma.module.findFirst({
      where: { 
        courseId: Number(courseId),
        title: {
          equals: title.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      return NextResponse.json({ message: "Module with this title already exists in this course" }, { status: 400 });
    }

    const module = await prisma.module.create({
      data: {
        title,
        description,
        order: Number(order),
        courseId: Number(courseId),
      },
    });

    return NextResponse.json({ module }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ UPDATE MODULE
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, order } = body;

    const module = await prisma.module.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        order: Number(order),
      },
    });

    return NextResponse.json({ module }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ GET MODULES BY COURSE
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ message: "courseId is required" }, { status: 400 });
    }

    // Students can see modules for filtering, Admins can manage them.
    // We allow both to GET them.
    const modules = await prisma.module.findMany({
      where: { courseId: Number(courseId) },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ modules }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// ✅ DELETE MODULE
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    await prisma.module.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Module deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}



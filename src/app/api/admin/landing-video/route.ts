import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const video = await prisma.systemVideo.findFirst();
    return NextResponse.json(video);
  } catch (error) {
    console.error("GET System Video Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoType, videoUrl } = body;

    if (!videoType || !videoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.systemVideo.findFirst();

    let video;
    if (existing) {
      video = await prisma.systemVideo.update({
        where: { id: existing.id },
        data: { videoType, videoUrl },
      });
    } else {
      video = await prisma.systemVideo.create({
        data: { videoType, videoUrl },
      });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error("PUT System Video Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.systemVideo.deleteMany();

    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("DELETE System Video Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

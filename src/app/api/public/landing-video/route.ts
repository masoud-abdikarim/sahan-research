import { NextResponse } from "next/server";
import prisma from "@/prisma";

export async function GET() {
  try {
    const video = await prisma.systemVideo.findFirst();
    return NextResponse.json(video || null);
  } catch (error) {
    console.error("GET Public System Video Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

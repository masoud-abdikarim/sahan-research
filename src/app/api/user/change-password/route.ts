import { NextResponse } from "next/server";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { newPassword, confirmPassword } = await req.json();

    // 1. Basic validation
    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // 2. Match validation
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match" }, { status: 400 });
    }

    // 3. Length validation (minimum 6 characters as per requirements)
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // 4. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update user in database
    await prisma.user.update({
      where: { id: Number(session.id) },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

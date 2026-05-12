import { NextResponse } from "next/server";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { action, phone, email, password } = await req.json();

    if (action === "verify-phone") {
      if (!phone) {
        return NextResponse.json({ message: "Phone number is required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        // Generic message to avoid enumeration, but user asked for "friendly error if not found"
        // I'll stick to a slightly generic but helpful message
        return NextResponse.json({ message: "No account found with this information" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "verify-email") {
      if (!phone || !email) {
        return NextResponse.json({ message: "Phone and email are required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user || user.email !== email) {
        return NextResponse.json({ message: "Information does not match our records" }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reset-password") {
      if (!phone || !email || !password) {
        return NextResponse.json({ message: "All fields are required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user || user.email !== email) {
        return NextResponse.json({ message: "Invalid verification state" }, { status: 400 });
      }

      // Password complexity check
      const passwordError = validatePassword(password);
      if (passwordError) {
        return NextResponse.json({ message: passwordError }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: "Password updated successfully" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

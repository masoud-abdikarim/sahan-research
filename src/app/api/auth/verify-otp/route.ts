import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/prisma";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json({ message: "userId and otp are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 400 });
    }

    // Check attempt limit
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { message: "Too many incorrect attempts. Please request a new OTP.", tooManyAttempts: true },
        { status: 429 }
      );
    }

    // Check expiry
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one.", expired: true },
        { status: 400 }
      );
    }

    // Verify OTP (stored as bcrypt hash)
    if (!user.otpCode) {
      return NextResponse.json({ message: "No OTP found. Please request a new one." }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp.toString(), user.otpCode);

    if (!isMatch) {
      const newAttempts = user.otpAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: newAttempts },
      });

      const remaining = MAX_OTP_ATTEMPTS - newAttempts;
      return NextResponse.json(
        {
          message: remaining > 0
            ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many incorrect attempts. Please request a new OTP.",
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    // Success — mark verified and clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpResendCount: 0,
        otpResendAt: null,
      },
    });

    // Issue session cookie
    const sessionData = { id: user.id, role: user.role, email: user.email, name: user.name };
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set("session", session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return NextResponse.json({
      message: "Email verified successfully!",
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

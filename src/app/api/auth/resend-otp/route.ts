import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/prisma";
import { sendOtpEmail } from "@/lib/mail";

const MAX_RESENDS_PER_HOUR = 3;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 400 });
    }

    // Rate limit: reset counter if last resend was > 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const resendCount = user.otpResendAt && user.otpResendAt > oneHourAgo ? user.otpResendCount : 0;

    if (resendCount >= MAX_RESENDS_PER_HOUR) {
      return NextResponse.json(
        { message: "Too many resend requests. Please wait before trying again.", rateLimited: true },
        { status: 429 }
      );
    }

    // Generate new OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: hashedOtp,
        otpExpiresAt,
        otpAttempts: 0,
        otpResendCount: resendCount + 1,
        otpResendAt: new Date(),
      },
    });

    // Send email
    await sendOtpEmail(user.email, user.name, otp);

    return NextResponse.json({ message: "A new verification code has been sent to your email." });
  } catch (error: any) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

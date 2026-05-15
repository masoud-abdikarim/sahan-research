import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/prisma";
import { sendOtpEmail } from "@/lib/mail";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";

import { PASSWORD_REGEX, validatePassword } from "@/lib/validation";

// Strong email regex — rejects test@test, abc.com, hello@, fake123
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ CREATE USER (SIGNUP) — now sends OTP before account is active
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Validate email format strictly
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address (e.g. name@domain.com)" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ message: "An account with this email already exists" }, { status: 409 });
      }
      return NextResponse.json({ message: "An account with this phone number already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP (DISABLED but kept for future use)
    /*
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    */

    // Create user — Now verified immediately
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || "USER",
        emailVerified: true, // Automatically verify
        /*
        otpCode: hashedOtp,
        otpExpiresAt,
        otpAttempts: 0,
        */
      },
    });

    /*
    // Send OTP email (DISABLED but kept for future use)
    try {
      await sendOtpEmail(user.email, user.name, otp);
    } catch (mailErr: any) {
      // If email fails, delete the user so they can retry
      await prisma.user.delete({ where: { id: user.id } });
      console.error("Mail send failed:", mailErr.message);
      return NextResponse.json(
        { message: "Failed to send verification email. Please check your email address and try again." },
        { status: 500 }
      );
    }
    */

    // Create session
    const sessionData = { id: user.id, role: user.role, email: user.email, name: user.name };
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set("session", session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Return success response — Now includes user data for auto-login
    return NextResponse.json(
      {
        message: "Account created successfully!",
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
        requiresVerification: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}

// Get all users
export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
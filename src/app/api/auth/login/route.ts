import { NextResponse } from "next/server";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkIpRateLimit, resetIpRateLimit } from "@/lib/rate-limit";

const BASE_LOCK_MS = 30 * 1000; // 30 seconds

/**
 * Returns lock duration in milliseconds.
 * Each subsequent lock increases by 30 seconds.
 * lockCount represents how many times the user has been locked before.
 */
function formatDuration(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  return parts.join(' ');
}
function getLockDuration(lockCount: number) {
  return (lockCount + 1) * BASE_LOCK_MS;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("remote-addr") || "unknown-ip";
    const ipCheck = checkIpRateLimit(ip);
    
    if (ipCheck.locked) {
      const minutes = Math.ceil(ipCheck.waitMs! / 60000);
      return NextResponse.json({ 
        message: `Too many attempts from your IP. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        locked: true,
        lockUntil: ipCheck.lockUntil
      }, { status: 403 });
    }

    const { identifier, password } = await req.json();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (user.loginLockUntil && new Date() < user.loginLockUntil) {
      const waitMs = user.loginLockUntil.getTime() - Date.now();
      const seconds = Math.ceil(waitMs / 1000);
      const durationStr = formatDuration(waitMs);
      return NextResponse.json({
        message: `Too many failed login attempts. Please wait ${durationStr} before trying again.`,
        locked: true,
        lockUntil: user.loginLockUntil.toISOString(),
      }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Increment failed attempts and record timestamp
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLogin: new Date(),
        },
      });

      const failedAttempts = updatedUser.failedLoginAttempts;
      const lockCount = user.lockLevel ?? 0; // reuse lockLevel as lock count

      // 3 attempts initially, then 1 attempt for subsequent locks
      const allowedAttempts = lockCount === 0 ? 3 : 1;

      if (failedAttempts >= allowedAttempts) {
        const lockDurationMs = getLockDuration(lockCount);
        const lockUntil = new Date(Date.now() + lockDurationMs);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockLevel: lockCount + 1,
            loginLockUntil: lockUntil,
          },
        });
        const durationStr = formatDuration(lockDurationMs);
        return NextResponse.json(
          {
            message: `Too many failed login attempts. Please wait ${durationStr} before trying again.`,
            locked: true,
            lockUntil: lockUntil.toISOString(),
          },
          { status: 403 }
        );
      }

      // Not locked yet, return generic invalid credentials
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    /*
    // Block login if email not verified (DISABLED for now)
    if (!user.emailVerified) {
      return NextResponse.json(
        { message: "Please verify your email before logging in.", emailNotVerified: true, userId: user.id },
        { status: 403 }
      );
    }
    */

    // Reset lockout fields and IP limit upon successful login
    resetIpRateLimit(ip);
    
    if (user.failedLoginAttempts > 0 || user.lockLevel > 0 || user.loginLockUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockLevel: 0,
          loginLockUntil: null,
          lastFailedLogin: null
        }
      });
    }

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

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkIpRateLimit, resetIpRateLimit } from "@/lib/rate-limit";

const BASE_LOCK_DURATIONS = [
  1 * 60 * 1000,      // Level 1: 1m
  4 * 60 * 1000,      // Level 2: 4m
  10 * 60 * 1000,     // Level 3: 10m
  20 * 60 * 1000,     // Level 4: 20m
  40 * 60 * 1000,     // Level 5: 40m
  60 * 60 * 1000,     // Level 6: 1h
  2 * 60 * 60 * 1000, // Level 7: 2h
  4 * 60 * 60 * 1000, // Level 8: 4h
  8 * 60 * 60 * 1000, // Level 9: 8h
  24 * 60 * 60 * 1000 // Level 10: 24h
];

function getLockDuration(level: number, isAdmin: boolean) {
  let adjustedLevel = isAdmin ? level + 2 : level;
  if (adjustedLevel >= BASE_LOCK_DURATIONS.length) adjustedLevel = BASE_LOCK_DURATIONS.length - 1;
  return BASE_LOCK_DURATIONS[adjustedLevel];
}

function getMaxAttempts(level: number, isAdmin: boolean) {
  if (isAdmin) {
    return level === 0 ? 2 : 0;
  } else {
    return level === 0 ? 4 : level === 1 ? 2 : 0;
  }
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
      const minutes = Math.ceil(waitMs / 60000);
      return NextResponse.json({ 
        message: `Too many failed attempts. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        locked: true,
        lockUntil: user.loginLockUntil.toISOString()
      }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      const isAdmin = user.role === 'ADMIN';

      // Use atomic increment to prevent race conditions
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLogin: new Date()
        }
      });

      let failedAttempts = updatedUser.failedLoginAttempts;
      let lockLevel = updatedUser.lockLevel;
      let loginLockUntil = updatedUser.loginLockUntil;
      let isLockedNow = false;

      const maxAttempts = getMaxAttempts(lockLevel, isAdmin);

      if (failedAttempts > maxAttempts) {
        const durationMs = getLockDuration(lockLevel, isAdmin);
        loginLockUntil = new Date(Date.now() + durationMs);
        lockLevel += 1;
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0, // Reset for the next level
            lockLevel: lockLevel,
            loginLockUntil: loginLockUntil
          }
        });
        isLockedNow = true;
      }

      if (isLockedNow) {
        const waitMs = loginLockUntil!.getTime() - Date.now();
        const minutes = Math.ceil(waitMs / 60000);
        return NextResponse.json({ 
          message: `Too many failed attempts. Account locked for ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          locked: true,
          lockUntil: loginLockUntil!.toISOString()
        }, { status: 403 });
      }

      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Block login if email not verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { message: "Please verify your email before logging in.", emailNotVerified: true, userId: user.id },
        { status: 403 }
      );
    }

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


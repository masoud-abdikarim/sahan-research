import { NextResponse } from "next/server";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { isSuperAdmin, canCreateSuperadmin, canManageAdmins } from "@/lib/permissions";
import { validatePassword } from "@/lib/validation";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// GET: List all users (restricted to SUPERADMIN)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperAdmin(session.role)) {
      return NextResponse.json({ message: "Forbidden: Superadmin access required" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Users API Error:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  }
}

// POST: Create a new user (with role verification)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, password, role } = body;

    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // Validate email format
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

    // 1. Role validation and permissions check
    if (role === "SUPERADMIN") {
      if (!canCreateSuperadmin(session.role)) {
        return NextResponse.json({ message: "Forbidden: You do not have permission to create a Superadmin" }, { status: 403 });
      }
    } else if (role === "ADMIN") {
      if (!canManageAdmins(session.role)) {
        return NextResponse.json({ message: "Forbidden: Only Superadmins can create Admin accounts" }, { status: 403 });
      }
    } else if (role === "USER") {
      // Let both admin roles create students if needed, or restrict to Superadmin. Let's allow both.
      if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ message: "Invalid role specified" }, { status: 400 });
    }

    // Check if user already exists
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

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        emailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Log action for audit
    console.log(`[AUDIT] User (ID: ${session.id}, Role: ${session.role}) created new account (ID: ${newUser.id}, Role: ${newUser.role})`);

    return NextResponse.json({
      message: "User created successfully",
      user: newUser
    }, { status: 201 });

  } catch (error: any) {
    console.error("Create User API Error:", error);
    return NextResponse.json({ message: "Server error", details: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import bcrypt from "bcryptjs";

// PUT: Update user (SUPERADMIN only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperAdmin(session.role)) {
      return NextResponse.json({ message: "Forbidden: Superadmin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = Number(resolvedParams.id);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const data = await req.json();
    const { name, email, phone, password, role } = data;

    if (!name || !email || !phone || !role) {
      return NextResponse.json({ message: "Name, email, phone, and role are required" }, { status: 400 });
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });
    if (existingEmail) {
      return NextResponse.json({ message: "Email is already in use by another user" }, { status: 400 });
    }

    // Check phone uniqueness
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: userId }
      }
    });
    if (existingPhone) {
      return NextResponse.json({ message: "Phone number is already in use by another user" }, { status: 400 });
    }

    const userUpdateData: any = {
      name,
      email,
      phone,
      role
    };

    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
    }

    // Prevent a superadmin from downgrading their own role
    if (targetUser.id === session.id && role !== "SUPERADMIN") {
      return NextResponse.json({ message: "Cannot change your own role from SUPERADMIN" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });

    console.log(`[AUDIT] Superadmin (ID: ${session.id}) updated User (ID: ${userId}) details`);

    return NextResponse.json({ 
      message: "User updated successfully", 
      user: updatedUser 
    });

  } catch (error: any) {
    console.error("Update User Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

// DELETE: Delete user (SUPERADMIN only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperAdmin(session.role)) {
      return NextResponse.json({ message: "Forbidden: Superadmin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = Number(resolvedParams.id);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Safeguard: Prevent self-deletion
    if (targetUser.id === session.id) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 });
    }

    // Run cascade deletion in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete user's enrollments (which cascade to progress, exam scores, and exam attempts)
      await tx.enrollment.deleteMany({
        where: { userId }
      });

      // 2. Delete certificates
      await tx.certificate.deleteMany({
        where: { userId }
      });

      // 3. Delete standalone exam attempts
      await tx.examAttempt.deleteMany({
        where: { userId }
      });

      // 4. If they were an instructor/admin, they might have created courses.
      // Set courses created by them to be owned by the session user (this superadmin) or delete them?
      // Better to transfer ownership of their created courses to the deleting Superadmin to keep courses stable.
      await tx.course.updateMany({
        where: { userId },
        data: { userId: session.id }
      });

      // 5. Delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    console.log(`[AUDIT] Superadmin (ID: ${session.id}) deleted User (ID: ${userId}, Email: ${targetUser.email})`);

    return NextResponse.json({ message: "User account and all associated data successfully removed" });

  } catch (error: any) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

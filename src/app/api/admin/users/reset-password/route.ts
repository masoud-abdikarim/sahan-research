import { NextResponse } from "next/server";
import prisma from "@/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const session = await getSession();

    // 1. Strict Admin Authorization
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { action, identifier, newPassword } = await req.json();

    // ACTION: FIND USER
    if (action === "find") {
      if (!identifier) {
        return NextResponse.json({ message: "Identifier (email or phone) is required" }, { status: 400 });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true
        }
      });

      if (!user) {
        return NextResponse.json({ message: "User not found with that email or phone" }, { status: 404 });
      }

      // Restrict regular ADMIN from finding admins/superadmins
      if ((user.role === "ADMIN" || user.role === "SUPERADMIN") && session.role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Forbidden: Only SUPERADMIN can search admin accounts" }, { status: 403 });
      }

      return NextResponse.json({ user });
    }

    // ACTION: RESET PASSWORD
    if (action === "reset") {
      if (!identifier || !newPassword) {
        return NextResponse.json({ message: "Identifier and new password are required" }, { status: 400 });
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return NextResponse.json({ message: passwordError }, { status: 400 });
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        }
      });

      if (!user) {
        return NextResponse.json({ message: "User no longer exists" }, { status: 404 });
      }

      // Only SUPERADMIN can reset password for admins/superadmins
      if ((user.role === "ADMIN" || user.role === "SUPERADMIN") && session.role !== "SUPERADMIN") {
        return NextResponse.json({ message: "Forbidden: Only SUPERADMIN can reset admin passwords" }, { status: 403 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      // Log action for audit purposes
      console.log(`[AUDIT] Admin (ID: ${session.id}) reset password for User (ID: ${user.id}, Email: ${user.email}) at ${new Date().toISOString()}`);

      return NextResponse.json({ message: `Password for ${user.name} has been successfully reset` });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin Password Reset Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

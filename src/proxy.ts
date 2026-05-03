import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "super-secret-key-please-change-in-production";
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const path = request.nextUrl.pathname;
  const method = request.method;

  // 1. PUBLIC ROUTES EXCEPTIONS
  // Allow registration (POST /api/user)
  if (path === "/api/user" && method === "POST") {
    return NextResponse.next();
  }

  // 2. DEFINE PROTECTED ROUTES
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/api/user") || path.startsWith("/api/admin");
  const isAdminRoute = path.startsWith("/dashboard/admin") || path.startsWith("/api/admin") || (path === "/api/user" && method === "GET");

  if (isProtectedRoute) {
    if (!session) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload }: any = await jwtVerify(session, key, { algorithms: ["HS256"] });
      
      // Admin check for admin-only routes
      if (isAdminRoute && payload.role !== "ADMIN") {
        if (path.startsWith("/api/")) {
          return NextResponse.json({ message: "Forbidden: Admin only" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Student-only check (Optional: prevent Admins from student dashboard to enforce clean separation)
      // The user requested: "The default /dashboard route must NOT show admin or super admin content"
      // If Admin tries to visit /dashboard, redirect them to /dashboard/admin
      if (path === "/dashboard" && payload.role === "ADMIN") {
         return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      
      return NextResponse.next();
    } catch (err) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ message: "Invalid session" }, { status: 401 });
      }
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/user", "/api/user/:path*", "/api/admin", "/api/admin/:path*"],
};

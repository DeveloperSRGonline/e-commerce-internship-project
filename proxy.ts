import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Route protection proxy (replaces middleware in Next.js 16).
 *
 * Protection matrix per actionable.md § 2.2.2:
 *   - /cart, /checkout, /orders/*           → require authenticated session
 *   - /admin/*                              → require role === "admin"
 *   - /api/cart/*, /api/checkout/*, /api/orders/*  → require authenticated session
 *   - /api/admin/*                          → require authenticated session (role checked in handlers)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Public routes — always pass through ───────────────────────────────────
  const publicPatterns = [
    /^\/$/, // Home
    /^\/products(\/.*)?$/, // /products and /products/[slug]
    /^\/categories(\/.*)?$/, // /categories and /categories/[slug]
    /^\/login/,
    /^\/register/,
    /^\/api\/products(\/.*)?$/, // Public product API
    /^\/api\/categories(\/.*)?$/, // Public categories API
  ];
  if (publicPatterns.some((p) => p.test(pathname))) {
    return NextResponse.next();
  }

  const session = await auth();

  // ── Customer-protected pages ───────────────────────────────────────────────
  const customerProtected =
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders");

  // ── Admin-protected pages ─────────────────────────────────────────────────
  const adminProtected = pathname.startsWith("/admin");

  // ── Customer-protected API routes ─────────────────────────────────────────
  const customerApiProtected =
    pathname.startsWith("/api/cart") ||
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/orders");

  // ── Admin-protected API routes ────────────────────────────────────────────
  const adminApiProtected = pathname.startsWith("/api/admin");

  if (customerProtected || customerApiProtected) {
    if (!session?.user?.userId) {
      if (customerApiProtected) {
        return Response.json(
          { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (adminProtected) {
    if (!session?.user?.userId) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }
  }

  if (adminApiProtected) {
    if (!session?.user?.userId) {
      return Response.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication required" } },
        { status: 401 }
      );
    }
    // Note: Role is checked again in each admin Route Handler (defense-in-depth)
  }

  return NextResponse.next();
}

// Explicit matcher — only protected paths, avoids gating static files
export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/api/cart/:path*",
    "/api/checkout/:path*",
    "/api/orders/:path*",
    "/api/admin/:path*",
  ],
};

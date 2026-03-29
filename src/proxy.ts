import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Not authenticated → redirect to sign in
  if (!req.auth) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = req.auth.user.role;

  // Only ADMIN and TEAM can access /admin
  if (role !== "ADMIN" && role !== "TEAM") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Only ADMIN can access /admin/users and /admin/settings
  if (
    (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings")) &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};

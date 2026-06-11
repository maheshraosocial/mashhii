import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/access-denied") ||
    pathname.startsWith("/api/auth");

  if (isPublic) {
    // Authenticated users should not see the login page
    if (isLoggedIn && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

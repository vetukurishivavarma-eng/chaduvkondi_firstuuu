import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "chaduvkondi-super-secret-key-change-in-production";

const protectedPaths = ["/dashboard", "/quiz", "/admin", "/leaderboard", "/onboarding", "/profile", "/spaced-repetition", "/roadmaps", "/playground", "/battles", "/ai-tutor", "/challenges"];
const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Verify token is actually valid (not just exists)
  let isValidToken = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      isValidToken = true;
    } catch {
      // Token expired or invalid - clear it
      const response = NextResponse.next();
      response.cookies.set("token", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

  // Redirect to login if protected path and no valid token
  if (!isValidToken && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth pages (login/signup) are not auto-redirected —
  // the login page itself handles the "already logged in" state
  // so users can choose to sign in with a different account.

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/quiz/:path*", "/admin/:path*", "/leaderboard/:path*", "/onboarding/:path*", "/profile/:path*", "/spaced-repetition/:path*", "/roadmaps/:path*", "/playground/:path*", "/battles/:path*", "/ai-tutor/:path*", "/challenges/:path*", "/login", "/signup"],
};

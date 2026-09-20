import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gestor-rifas-default-secret-change-in-production"
);

const SESSION_COOKIE = "user_session";

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: require master admin cookie OR user session with is_admin
  if (pathname.startsWith("/admin")) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (sessionToken) {
      const payload = await verifyJWT(sessionToken);
      if (payload && payload.is_admin) {
        return NextResponse.next();
      }
    }
    // Redirect to login if no valid session
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protected routes: /dashboard, /create, /manage/*, /fiado/create, /fiado/*, /promo/create, /promo-manage/*
  const protectedPrefixes = [
    "/dashboard",
    "/create",
    "/manage",
    "/fiado/create",
    "/fiado/",
    "/promo/create",
    "/promo-manage",
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/create",
    "/manage/:path*",
    "/fiado/create",
    "/fiado/:path*",
    "/promo/create",
    "/promo-manage/:path*",
  ],
};

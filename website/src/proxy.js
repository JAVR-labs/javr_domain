import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET,
);

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  const isPublicPath = pathname === "/login" || pathname === "/api/login";
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/img/") ||
    pathname.startsWith("/background/") ||
    pathname === "/favicon.ico";

  if (isPublicPath || isStaticAsset) {
    return NextResponse.next();
  }

  const token = req.cookies.get("authtoken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwt.verify(token, SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("authtoken");
    return response;
  }
}
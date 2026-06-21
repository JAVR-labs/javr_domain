import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { isTokenBlacklisted } from "./utils/blacklist";
import axios from "axios";
import { serialize } from "cookie";
import { ConfigManager, ConfigTypes } from "@/server/lib/ConfigManager.cjs";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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
  const refreshToken = req.cookies.get("refreshtoken")?.value;

  // Function to handle redirection and cleanup
  const redirectToLogin = () => {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("authtoken");
    response.cookies.delete("refreshtoken");
    return response;
  };

  if (!token || (await isTokenBlacklisted(token))) {
    // If no access token, try to refresh
    if (refreshToken) {
      return await tryRefresh(req, refreshToken);
    }
    return redirectToLogin();
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch (err) {
    // Token verification failed (e.g., expired)
    if (refreshToken) {
      return await tryRefresh(req, refreshToken);
    }
    return redirectToLogin();
  }
}

async function tryRefresh(req, refreshToken) {
  const config = ConfigManager.getConfig(ConfigTypes.websiteConfig);
  const managers = config?.managers || [];
  const manager = managers[0] || { ip: "localhost", port: 3001 };
  const refreshUrl = `http://${manager.ip}:${manager.port}/refresh`;

  try {
    const response = await axios.post(refreshUrl, { refreshToken });

    if (response.status === 200) {
      const { token, refreshToken: newRefreshToken } = response.data;

      const accessCookie = serialize("authtoken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60, // 15 minutes
        path: "/",
      });

      const refreshCookie = serialize("refreshtoken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      const nextResponse = NextResponse.next();
      nextResponse.headers.append("Set-Cookie", accessCookie);
      nextResponse.headers.append("Set-Cookie", refreshCookie);
      return nextResponse;
    }
  } catch (error) {
    console.error("Refresh failed:", error.message);
  }

  // If refresh fails, go to login
  const loginResponse = NextResponse.redirect(new URL("/login", req.url));
  loginResponse.cookies.delete("authtoken");
  loginResponse.cookies.delete("refreshtoken");
  return loginResponse;
}

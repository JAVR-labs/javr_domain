import { serialize } from "cookie";
import { blacklistToken } from "@/src/utils/blacklist";

export default async function handler(req, res) {
  const token = req.cookies.authtoken;

  token && blacklistToken(token);

  const accessTokenCookie = serialize("authtoken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1, // Expire immediately
    path: "/",
  });

  const refreshTokenCookie = serialize("refreshtoken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1, // Expire immediately
    path: "/",
  });

  res.setHeader("Set-Cookie", [accessTokenCookie, refreshTokenCookie]);
  return res.status(200).json({ message: "Wylogowano" });
}

import { serialize } from "cookie";

export default async function handler(req, res) {
  const cookie = serialize("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: -1, // Expire immediately
    path: "/",
  });

  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ message: "Logged out" });
}

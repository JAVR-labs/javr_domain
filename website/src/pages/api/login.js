import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { nick, password } = req.body;

  if (nick === "a2" && password === "abc123") {
    const token = jwt.sign(
      { nick },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" },
    );

    const cookie = serialize("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ message: "Success" });
  }

  return res
    .status(401)
    .json({ message: "Nie znaleziono loginu albo hasło jest nie poprawne!" });
}

import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import axios from "axios";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { nick, password } = req.body;

  let managers = [];
  try {
    const configPath = path.join(
      process.cwd(),
      "configs",
      "website-config.json",
    );
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      managers = config.managers || [];
    }
  } catch (err) {
    console.error("Error loading website-config.json:", err);
  }

  const manager = managers[0] || { ip: "localhost", port: 3001 };
  const authUrl = `http://${manager.ip}:${manager.port}/login`;

  try {
    const response = await axios.post(authUrl, { nick, password });

    if (response.status === 200) {
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
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ message: error.response.data.message });
    }
    console.error("Auth error:", error.message);
    return res.status(500).json({
      message: "Błąd połączenia z serwerem autoryzacji (Server Manager)",
    });
  }

  return res
    .status(401)
    .json({ message: "Nie znaleziono loginu albo hasło jest nie poprawne!" });
}

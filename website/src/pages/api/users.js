import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const { auth_token } = req.cookies;

  if (!auth_token) {
    return res.status(401).json({ message: "Brak autoryzacji" });
  }

  try {
    jwt.verify(auth_token, process.env.JWT_SECRET || "fallback-secret");
  } catch (err) {
    return res.status(401).json({ message: "Nieprawidłowy token" });
  }

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
  const baseUrl = `http://${manager.ip}:${manager.port}/users`;

  try {
    if (req.method === "GET") {
      const response = await axios.get(baseUrl);
      return res.status(200).json(response.data);
    } else if (req.method === "POST") {
      const response = await axios.post(baseUrl, req.body);
      return res.status(201).json(response.data);
    } else if (req.method === "DELETE") {
      const { id } = req.query;
      const response = await axios.delete(`${baseUrl}/${id}`);
      return res.status(200).json(response.data);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("User management error:", error.message);
    return res
      .status(500)
      .json({ message: "Błąd połączenia z serwerem managerem" });
  }
}

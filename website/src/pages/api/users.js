import jwt from "jsonwebtoken";
import axios from "axios";
import { ConfigManager, ConfigTypes } from "@/server/lib/ConfigManager.cjs";
import { customLog } from "@/server/utils/custom-utils.cjs";

export default async function handler(req, res) {
  const { authtoken } = req.cookies || {};

  if (!authtoken) {
    return res.status(401).json({ message: "Brak autoryzacji" });
  }

  try {
    jwt.verify(authtoken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Nieprawidłowy token" });
  }

  const config = ConfigManager.getConfig(ConfigTypes.websiteConfig);
  const managers = config?.managers || [];
  const manager = managers[0] || { ip: "localhost", port: 3001 };
  const baseUrl = `http://${manager.ip}:${manager.port}/users`;

  const axiosConfig = {
    headers: { Authorization: `Bearer ${authtoken}` },
  };

  try {
    if (req.method === "GET") {
      const response = await axios.get(baseUrl, axiosConfig);
      return res.status(200).json(response.data);
    }

    if (req.method === "POST") {
      const response = await axios.post(baseUrl, req.body, axiosConfig);
      return res.status(201).json(response.data);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      const response = await axios.delete(`${baseUrl}/${id}`, axiosConfig);
      return res.status(200).json(response.data);
    }

    if (req.method === "PATCH") {
      const { id, currentPassword, password, confirmPassword } = req.body;

      if (!id || !currentPassword || !password || !confirmPassword) {
        return res.status(400).json({ message: "Brakujące dane" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Hasła nie są takie same" });
      }

      const response = await axios.post(
        `${baseUrl}/${id}/password`,
        {
          currentPassword,
          newPassword: password,
          confirmPassword,
        },
        axiosConfig,
      );

      return res.status(200).json(response.data);
    }

    return res.status(405).json({ message: "Metoda nie dozwolona" });
  } catch (error) {
    customLog("Error" ,`User management error: ${error.response?.status}, ${error.response?.data || error.message}`);
    return res.status(error.response?.status || 500).json(
      error.response?.data || { message: "Błąd połączenia z serwerem managerem" }
    );
  }
}
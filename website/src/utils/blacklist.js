import axios from "axios";
import { ConfigManager, ConfigTypes } from "@/server/lib/ConfigManager.cjs";

async function getManagerBaseUrl() {
  const config = ConfigManager.getConfig(ConfigTypes.websiteConfig);
  const managers = config?.managers || [];
  const manager = managers[0] || { ip: "localhost", port: 3001 };
  return `http://${manager.ip}:${manager.port}`;
}

export async function blacklistToken(token) {
  if (!token) return;

  try {
    const baseUrl = await getManagerBaseUrl();
    await axios.post(`${baseUrl}/blacklist`, { token });
  } catch (err) {
    console.error("Failed to blacklist token:", err.message);
  }
}

export async function isTokenBlacklisted(token) {
  if (!token) return false;

  try {
    const baseUrl = await getManagerBaseUrl();
    const response = await axios.post(`${baseUrl}/check-blacklist`, { token });
    return response.data.blacklisted === true;
  } catch (err) {
    console.error("Failed to check blacklist:", err.message);
    return false;
  }
}

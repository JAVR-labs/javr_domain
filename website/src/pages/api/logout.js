import { stringifySetCookie } from 'cookie';
import { blacklistToken } from '@/src/utils/blacklist';
import axios from 'axios';
import { ConfigManager } from '@javr-domain/shared/ConfigManager.cjs';
import { ConfigTypes, FileTemplates } from '@server-lib/ConfigSettings';

export default async function handler(req, res) {
  const token = req.cookies.authtoken;
  const refreshToken = req.cookies.refreshtoken;

  token && (await blacklistToken(token));

  if (refreshToken) {
    try {
      const configManager = new ConfigManager(ConfigTypes, FileTemplates);
      const config = configManager.getConfig(ConfigTypes.websiteConfig);
      const managers = config?.managers || [];
      const manager = managers[0] || { ip: 'localhost', port: 3001 };
      await axios.post(`http://${manager.ip}:${manager.port}/revoke-refresh`, {
        refreshToken,
      });
    } catch (err) {
      console.error('Failed to revoke refresh token:', err.message);
    }
  }

  // Clear cookies
  const accessTokenCookie = stringifySetCookie({
    name: 'authtoken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  });

  const refreshTokenCookie = stringifySetCookie({
    name: 'refreshtoken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  });

  res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
  return res.status(200).json({ message: 'Wylogowano' });
}

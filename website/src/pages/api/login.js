import { stringifySetCookie } from 'cookie';
import axios from 'axios';
import { customLog } from '@javr-domain/shared/Logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { nick, password } = req.body;

  const managers = req.websiteConfig?.managers || [];
  const manager = managers[0] || { ip: 'localhost', port: 3001 };

  const authUrl = `http://${manager.ip}:${manager.port}/login`;

  try {
    const response = await axios.post(authUrl, { nick, password });

    if (response.status === 200) {
      const { token, refreshToken } = response.data;

      const accessTokenCookie = stringifySetCookie({
        name: 'authtoken',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60,
        path: '/',
      });

      const refreshTokenCookie = stringifySetCookie({
        name: 'refreshtoken',
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
      return res.status(200).json({ message: 'Success' });
    }

    return res.status(401).json({ message: 'Nie znaleziono loginu albo hasło jest nie poprawne!' });
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 429)) {
      return res.status(error.response.status).json({ message: error.response.data.message });
    }

    customLog('Login', `Auth error: ${error.message}`);
    return res.status(500).json({
      message: 'Błąd połączenia z serwerem',
    });
  }
}

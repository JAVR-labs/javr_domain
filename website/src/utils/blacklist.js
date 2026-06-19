const blacklist = new Set();

export function blacklistToken(token) {
  if (token) {
    blacklist.add(token);
  }
}

export function isTokenBlacklisted(token) {
  return blacklist.has(token);
}

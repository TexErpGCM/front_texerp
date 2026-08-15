const SESSION_KEYS = ['token', 'tokenType', 'userId', 'name', 'email', 'role'] as const;

interface JwtPayload {
  exp?: number;
  role?: string;
  roles?: string[];
  authorities?: string[];
  sub?: string;
}

export function clearStoredSession(): void {
  SESSION_KEYS.forEach(key => localStorage.removeItem(key));
}

export function readJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, clockSkewSeconds = 5): boolean {
  const payload = readJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp <= Math.floor(Date.now() / 1000) + clockSkewSeconds;
}

export function roleFromToken(token: string): string | null {
  const payload = readJwtPayload(token);
  const role = payload?.role ?? payload?.roles?.[0] ?? payload?.authorities?.[0];
  return role?.replace(/^ROLE_/, '') ?? null;
}

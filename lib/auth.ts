import bcrypt from 'bcryptjs';

export interface AdminSession {
  adminId: string;
  username: string;
  displayName: string;
  role?: 'superadmin' | 'admin' | 'staff';
  exp: number;
}

const DEFAULT_SECRET = 'suan-dusit-lampang-meeting-room-default-secret-key-2026';

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Simple signed token using Web Crypto API HMAC-SHA256 (pure standard, fast on edge)
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(session: Omit<AdminSession, 'exp'>, secret = DEFAULT_SECRET): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60; // 8 hours
  const role = session.role || (session.username === 'chookait' ? 'superadmin' : 'admin');
  const payload: AdminSession = { ...session, role, exp };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadBase64));
  const signatureBase64 = Buffer.from(signatureBuffer).toString('base64url');

  return `${payloadBase64}.${signatureBase64}`;
}

export async function verifySessionToken(token: string, secret = DEFAULT_SECRET): Promise<AdminSession | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signatureBase64] = parts;
    const key = await getCryptoKey(secret);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      Buffer.from(signatureBase64, 'base64url'),
      new TextEncoder().encode(payloadBase64)
    );

    if (!isValid) return null;

    const payload: AdminSession = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      return null; // Expired
    }

    if (!payload.role) {
      payload.role = payload.username === 'chookait' ? 'superadmin' : 'admin';
    }

    return payload;
  } catch {
    return null;
  }
}

import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const PREFIX = 'scrypt:';
const KEY_LEN = 32;

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(pin, salt, KEY_LEN).toString('hex');
  return `${PREFIX}${key}:${salt}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  if (stored.startsWith(PREFIX)) {
    const rest = stored.slice(PREFIX.length);
    const colonIdx = rest.lastIndexOf(':');
    if (colonIdx === -1) { return false; }
    const storedKey = rest.slice(0, colonIdx);
    const salt = rest.slice(colonIdx + 1);
    const inputKey = scryptSync(pin, salt, KEY_LEN);
    const storedBuf = Buffer.from(storedKey, 'hex');
    if (inputKey.length !== storedBuf.length) { return false; }
    return timingSafeEqual(inputKey, storedBuf);
  }
  // Graceful fallback: upgrade plaintext PINs on first successful login
  return pin === stored;
}

import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";

export const SESSION_COOKIE = "scholar_session";
const SESSION_TTL_DAYS = 60;

// scrypt-based password hashing (production-grade, built into Node)
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const test = scryptSync(password, salt, 64);
    const real = Buffer.from(hash, "hex");
    return test.length === real.length && timingSafeEqual(test, real);
  } catch {
    return false;
  }
}

// Opaque session token (raw) — only the hash is stored in the DB
export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export const SESSION_MAX_AGE = SESSION_TTL_DAYS * 24 * 60 * 60;

// Username / handle validation
export function validateUsername(u: string): string | null {
  if (!u) return "Username is required";
  if (u.length < 3) return "Username must be at least 3 characters";
  if (u.length > 20) return "Username must be 20 characters or fewer";
  if (!/^[a-z0-9._]+$/i.test(u)) return "Only letters, numbers, dots and underscores";
  if (!/[a-z0-9]/i.test(u[0])) return "Must start with a letter or number";
  return null;
}

export function validateEmail(e: string): string | null {
  if (!e) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Enter a valid email address";
  return null;
}

export function validatePassword(p: string): string | null {
  if (!p) return "Password is required";
  if (p.length < 6) return "Password must be at least 6 characters";
  if (p.length > 200) return "Password is too long";
  return null;
}

export function slugifyHandle(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

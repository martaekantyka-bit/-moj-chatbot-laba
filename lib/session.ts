import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "czat_sesja";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 godzin

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

function sha256(text: string): Buffer {
  return createHash("sha256").update(text).digest();
}

// Zwraca konfigurację tylko wtedy, gdy jest kompletna. Brak = brak dostępu.
function getConfig(): { password: string; secret: string } | null {
  const password = process.env.CHAT_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret || secret.length < 32) return null;
  return { password, secret };
}

export function isAuthConfigured(): boolean {
  return getConfig() !== null;
}

// Podpis zależy też od hasła, więc zmiana CHAT_PASSWORD unieważnia stare sesje.
// Samo hasło nie trafia do cookie.
function sign(payload: string, config: { password: string; secret: string }): string {
  return createHmac("sha256", config.secret)
    .update(payload)
    .update(sha256(config.password))
    .digest("base64url");
}

export function isCorrectPassword(input: string): boolean {
  const config = getConfig();
  if (!config) return false;
  return timingSafeEqual(sha256(input), sha256(config.password));
}

export function createSessionToken(): string | null {
  const config = getConfig();
  if (!config) return null;
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = `${expires}.${randomBytes(16).toString("base64url")}`;
  return `${payload}.${sign(payload, config)}`;
}

export function isValidSession(token: string | undefined): boolean {
  const config = getConfig();
  if (!config || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(payload, config));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;

  const expires = Number(payload.split(".")[0]);
  return Number.isFinite(expires) && expires > Date.now() / 1000;
}

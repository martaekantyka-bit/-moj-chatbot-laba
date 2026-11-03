import { NextResponse } from "next/server";
import { clientKey, registerFailure, resetFailures, retryAfterSeconds } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  createSessionToken,
  isAuthConfigured,
  isCorrectPassword,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Dostęp zablokowany: serwer nie ma ustawionych CHAT_PASSWORD i SESSION_SECRET (min. 32 znaki)." },
      { status: 503 },
    );
  }

  const key = clientKey(request);
  const wait = retryAfterSeconds(key);
  if (wait > 0) {
    return NextResponse.json(
      { error: `Za dużo błędnych prób. Spróbuj ponownie za ${Math.ceil(wait / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  let password = "";
  try {
    const body = await request.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {}

  if (!isCorrectPassword(password)) {
    registerFailure(key);
    // Krótkie opóźnienie spowalnia zgadywanie.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ error: "Błędne hasło." }, { status: 401 });
  }

  resetFailures(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken()!, sessionCookieOptions);
  return response;
}

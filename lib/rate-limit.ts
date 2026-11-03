// Prosty limit błędnych prób logowania, trzymany w pamięci procesu.
// UWAGA: to tylko ochrona lokalna. Na hostingu (np. Vercel) działa wiele
// instancji i każda ma własny licznik, który znika po restarcie — tam
// potrzebny jest dodatkowo limit po stronie platformy (firewall / rate limiting).

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "lokalny";
}

export function retryAfterSeconds(key: string): number {
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= Date.now()) return 0;
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;
}

export function registerFailure(key: string): void {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= now) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function resetFailures(key: string): void {
  failures.delete(key);
}

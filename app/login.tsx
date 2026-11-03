"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Nie udało się zalogować.");
    } catch {
      setError("Brak połączenia z serwerem.");
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <main className="czat logowanie">
      <h1>Wpisz hasło</h1>
      <form className="formularz" onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło warsztatowe"
          aria-label="Hasło"
          autoComplete="current-password"
        />
        <button type="submit" disabled={!password || busy}>
          {busy ? "Sprawdzam…" : "Wejdź"}
        </button>
      </form>
      {error && <div className="blad">{error}</div>}
    </main>
  );
}

"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();

  const busy = status === "submitted" || status === "streaming";
  const canSend = input.trim().length > 0 && !busy;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <main className="czat">
      <header className="naglowek">
        <h1>Mój chatbot</h1>
        <button type="button" className="wyjdz" onClick={handleLogout}>
          Wyjdź
        </button>
      </header>

      <div className="rozmowa" aria-label="Rozmowa" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`wiadomosc ${message.role}`}>
            {message.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null,
            )}
          </div>
        ))}
        {status === "submitted" && <div className="oczekiwanie">Chatbot pisze…</div>}
        {error && <div className="blad">{error.message}</div>}
      </div>

      <form className="formularz" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napisz wiadomość…"
          aria-label="Wiadomość"
        />
        <button type="submit" disabled={!canSend}>
          {busy ? "Czekaj…" : "Wyślij"}
        </button>
      </form>
    </main>
  );
}

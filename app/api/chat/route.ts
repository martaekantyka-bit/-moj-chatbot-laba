import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession } from "@/lib/session";

export async function POST(request: Request) {
  // Najpierw sesja — bez niej model nie jest wywoływany.
  const store = await cookies();
  if (!isValidSession(store.get(SESSION_COOKIE)?.value)) {
    return new Response("Brak dostępu: wpisz hasło warsztatowe.", { status: 401 });
  }

  // Klucz i model są czytane tylko na serwerze, nigdy nie trafiają do przeglądarki.
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  if (!apiKey || !model) {
    return new Response(
      "Brak konfiguracji: uzupełnij OPENROUTER_API_KEY i OPENROUTER_MODEL w pliku .env.local, a potem uruchom serwer ponownie.",
      { status: 500 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  const openrouter = createOpenRouter({ apiKey });

  const result = streamText({
    model: openrouter(model),
    // Cała historia rozmowy, żeby model pamiętał poprzednie wiadomości.
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        console.error("Błąd OpenRouter:", error);
        return "Nie udało się uzyskać odpowiedzi od modelu. Sprawdź klucz, nazwę modelu i środki na koncie OpenRouter.";
      },
    }),
  });
}

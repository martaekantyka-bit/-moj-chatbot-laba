import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession } from "@/lib/session";
import Chat from "./chat";
import Login from "./login";

export default async function Home() {
  const store = await cookies();
  const loggedIn = isValidSession(store.get(SESSION_COOKIE)?.value);
  return loggedIn ? <Chat /> : <Login />;
}

import { redirect } from "next/navigation";
import { currentUser } from "../lib/session";

export default async function Home() {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <main>
      <h1>Hello, avarc</h1>
      <p>
        Signed in as {user.name ?? user.username} ({user.roles.join(", ")}).
      </p>
      <form method="post" action="/api/auth/logout">
        <input type="hidden" name="_csrf" value={user.csrfToken} />
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}

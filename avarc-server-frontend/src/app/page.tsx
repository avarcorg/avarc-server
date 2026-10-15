import { redirect } from "next/navigation";
import { AuthCard } from "../components/AuthCard";
import { currentUser } from "../lib/session";

export default async function Home() {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <AuthCard title="Hello, avarc">
      <p>
        Signed in as <strong className="text-stone-900 dark:text-stone-100">{user.name ?? user.username}</strong>
        <span className="ml-2 inline-flex gap-1 align-middle">
          {user.roles.map((role) => (
            <span
              key={role}
              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
              {role}
            </span>
          ))}
        </span>
      </p>
      <form method="post" action="/api/auth/logout">
        <input type="hidden" name="_csrf" value={user.csrfToken} />
        <button
          type="submit"
          className="w-full rounded-lg px-4 py-2.5 font-medium ring-1 ring-stone-300 transition hover:bg-stone-100 dark:ring-stone-700 dark:hover:bg-stone-800"
        >
          Log out
        </button>
      </form>
    </AuthCard>
  );
}

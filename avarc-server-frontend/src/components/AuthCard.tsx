import type { ReactNode } from "react";

// The centred card of the pages around the login.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-500">
          avarc
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <div className="mt-4 space-y-4 text-stone-600 dark:text-stone-400">{children}</div>
      </div>
    </main>
  );
}

export const buttonClass =
  "block w-full rounded-lg bg-amber-700 px-4 py-2.5 text-center font-medium text-white " +
  "transition hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 " +
  "focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900";

import type { ReactNode } from "react";

// The centred card of the pages around the login.
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl bg-surface p-8 shadow-lg ring-1 ring-line">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <div className="mt-4 space-y-4 text-muted">{children}</div>
    </div>
  );
}

export const buttonClass =
  "block w-full rounded-lg bg-accent px-4 py-2.5 text-center font-medium text-accent-ink " +
  "transition hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export const secondaryButtonClass =
  "block w-full rounded-lg px-4 py-2.5 text-center font-medium ring-1 ring-line transition " +
  "hover:bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

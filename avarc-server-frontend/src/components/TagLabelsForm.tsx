"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "../i18n/navigation";
import type { TagSummary } from "../lib/locationModel";

const input =
  "w-full rounded-md bg-surface px-3 py-2 ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

// The labels of the tags, per language, for admins. A row is saved on its own.
export function TagLabelsForm({
  tags,
  languages,
  csrfToken,
}: {
  tags: TagSummary[];
  languages: string[];
  csrfToken: string;
}) {
  const t = useTranslations("Tags");
  const router = useRouter();
  const [labels, setLabels] = useState<Record<string, Record<string, string>>>(
    Object.fromEntries(
      tags.map((tag) => [tag.key, Object.fromEntries(languages.map((l) => [l, tag.labels[l] ?? ""]))]),
    ),
  );
  const [state, setState] = useState<Record<string, "saving" | "saved" | string>>({});

  async function save(key: string) {
    setState((current) => ({ ...current, [key]: "saving" }));
    const given = Object.fromEntries(Object.entries(labels[key]).filter(([, text]) => text.trim() !== ""));
    try {
      const response = await fetch(`/api/tags/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ labels: given }),
      });
      if (response.ok) {
        setState((current) => ({ ...current, [key]: "saved" }));
        router.refresh();
      } else {
        const detail = (await response.json().catch(() => null))?.detail;
        setState((current) => ({ ...current, [key]: detail ?? t("failed", { status: response.status }) }));
      }
    } catch {
      setState((current) => ({ ...current, [key]: t("unreachable") }));
    }
  }

  if (tags.length === 0) {
    return <p className="text-muted">{t("empty")}</p>;
  }
  return (
    <ul className="space-y-4">
      {tags.map((tag) => (
        <li key={tag.key} className="space-y-3 rounded-lg bg-surface p-4 ring-1 ring-line">
          <p className="font-medium">
            <code>{tag.key}</code>
            <span className="ml-2 text-sm text-muted">{t("used", { count: tag.locations })}</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {languages.map((language) => (
              <label key={language} className="block space-y-1">
                <span className="text-sm font-medium">{t("labelIn", { language: language.toUpperCase() })}</span>
                <input
                  lang={language}
                  value={labels[tag.key][language]}
                  onChange={(event) =>
                    setLabels((current) => ({
                      ...current,
                      [tag.key]: { ...current[tag.key], [language]: event.target.value },
                    }))
                  }
                  className={input}
                />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => save(tag.key)}
              disabled={state[tag.key] === "saving"}
              className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink transition hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
            >
              {t("save")}
            </button>
            {state[tag.key] === "saved" && (
              <span role="status" className="text-sm text-muted">
                {t("saved")}
              </span>
            )}
            {state[tag.key] && state[tag.key] !== "saved" && state[tag.key] !== "saving" && (
              <span role="alert" className="text-sm text-danger-ink">
                {state[tag.key]}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

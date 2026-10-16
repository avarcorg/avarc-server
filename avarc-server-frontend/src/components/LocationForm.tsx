"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { useRouter } from "../i18n/navigation";
import {
  tagLabel,
  toRequestBody,
  type FormState,
  type TagSummary,
} from "../lib/locationModel";
import { PositionPickerLoader } from "./PositionPickerLoader";

const input =
  "w-full rounded-md bg-surface px-3 py-2 ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const primary =
  "rounded-lg bg-accent px-4 py-2 font-medium text-accent-ink transition hover:bg-accent-strong " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface " +
  "disabled:opacity-60";
const secondary =
  "rounded-lg px-4 py-2 font-medium ring-1 ring-line transition hover:bg-hover focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-accent";
const danger =
  "rounded-lg px-4 py-2 font-medium text-danger-ink ring-1 ring-danger-line transition hover:bg-danger-soft " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Confidence({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={input}>
        {[1, 2, 3, 4, 5].map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
    </Field>
  );
}

// The form to create a location (no id) or to change one. The request goes
// from the browser to the backend with the session cookie and the CSRF token;
// the backend checks the roles and every rule.
export function LocationForm({
  id,
  initial,
  languages,
  tags,
  csrfToken,
}: {
  id?: string;
  initial: FormState;
  languages: string[];
  tags: TagSummary[];
  csrfToken: string;
}) {
  const t = useTranslations("Form");
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [newTags, setNewTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const latitude = form.latitude.trim() === "" || Number.isNaN(Number(form.latitude)) ? null : Number(form.latitude);
  const longitude = form.longitude.trim() === "" || Number.isNaN(Number(form.longitude)) ? null : Number(form.longitude);

  const change = (changes: Partial<FormState>) => setForm((current) => ({ ...current, ...changes }));
  const changeText = (language: string, changes: Partial<FormState["texts"][string]>) =>
    setForm((current) => ({
      ...current,
      texts: { ...current.texts, [language]: { ...current.texts[language], ...changes } },
    }));

  async function send(method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<Response | null> {
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch(id ? `/api/locations/${id}` : "/api/locations", {
        method,
        headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (response.ok) {
        return response;
      }
      if (response.status === 401) {
        setProblem(t("sessionEnded"));
      } else if (response.status === 403) {
        setProblem(t("forbidden"));
      } else {
        const detail = (await response.json().catch(() => null))?.detail;
        setProblem(detail ?? t("failed", { status: response.status }));
      }
    } catch {
      setProblem(t("unreachable"));
    } finally {
      setBusy(false);
    }
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const typed = newTags
      .split(",")
      .map((key) => key.trim())
      .filter((key) => key !== "");
    const result = toRequestBody({ ...form, tags: [...new Set([...form.tags, ...typed])] }, languages);
    if ("error" in result) {
      setProblem(t(`error.${result.error}`));
      return;
    }
    const response = await send(id ? "PUT" : "POST", result.body);
    if (response) {
      const saved = (await response.json()) as { id: string };
      router.push(`/locations/${saved.id}`);
      router.refresh();
    }
  }

  async function remove() {
    if (!window.confirm(t("confirmDelete"))) {
      return;
    }
    if (await send("DELETE")) {
      router.push("/locations");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <fieldset className="space-y-4">
        <legend className="font-heading text-xl font-semibold">{t("position")}</legend>
        <p className="text-sm text-muted">{t("positionHint")}</p>
        <PositionPickerLoader
          latitude={latitude}
          longitude={longitude}
          label={t("pickerLabel")}
          onPick={(lat, lng) => change({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("latitude")}>
            <input
              inputMode="decimal"
              value={form.latitude}
              onChange={(event) => change({ latitude: event.target.value })}
              className={input}
            />
          </Field>
          <Field label={t("longitude")}>
            <input
              inputMode="decimal"
              value={form.longitude}
              onChange={(event) => change({ longitude: event.target.value })}
              className={input}
            />
          </Field>
        </div>
      </fieldset>

      {languages.map((language) => (
        <fieldset key={language} className="space-y-4">
          <legend className="font-heading text-xl font-semibold">
            {t("textIn", { language: language.toUpperCase() })}
          </legend>
          <Field label={t("name")}>
            <input
              lang={language}
              value={form.texts[language].name}
              onChange={(event) => changeText(language, { name: event.target.value })}
              className={input}
            />
          </Field>
          <Field label={t("description")}>
            <textarea
              lang={language}
              rows={5}
              value={form.texts[language].description}
              onChange={(event) => changeText(language, { description: event.target.value })}
              className={input}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("periodLabel")} hint={t("periodLabelHint")}>
              <input
                lang={language}
                value={form.texts[language].periodLabel}
                onChange={(event) => changeText(language, { periodLabel: event.target.value })}
                className={input}
              />
            </Field>
            <Confidence
              label={t("confidenceText")}
              value={form.texts[language].confidence}
              onChange={(confidence) => changeText(language, { confidence })}
            />
          </div>
        </fieldset>
      ))}

      <fieldset className="space-y-4">
        <legend className="font-heading text-xl font-semibold">{t("details")}</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Confidence
            label={t("confidence")}
            value={form.confidence}
            onChange={(confidence) => change({ confidence })}
          />
          <Field label={t("periodStart")} hint={t("yearHint")}>
            <input
              inputMode="numeric"
              value={form.periodStart}
              onChange={(event) => change({ periodStart: event.target.value })}
              className={input}
            />
          </Field>
          <Field label={t("periodEnd")}>
            <input
              inputMode="numeric"
              value={form.periodEnd}
              onChange={(event) => change({ periodEnd: event.target.value })}
              className={input}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-heading text-xl font-semibold">{t("tags")}</legend>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {tags.map((tag) => (
              <li key={tag.key}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.tags.includes(tag.key)}
                    onChange={(event) =>
                      change({
                        tags: event.target.checked
                          ? [...form.tags, tag.key]
                          : form.tags.filter((key) => key !== tag.key),
                      })
                    }
                    className="size-4 accent-accent"
                  />
                  {tagLabel(tag, locale)}
                </label>
              </li>
            ))}
          </ul>
        )}
        <Field label={t("newTags")} hint={t("newTagsHint")}>
          <input value={newTags} onChange={(event) => setNewTags(event.target.value)} className={input} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-heading text-xl font-semibold">{t("references")}</legend>
        {form.references.map((reference, index) => (
          <div key={index} className="space-y-3 rounded-lg bg-surface p-4 ring-1 ring-line">
            <Field label={t("url")}>
              <input
                type="url"
                inputMode="url"
                value={reference.url}
                onChange={(event) =>
                  change({
                    references: form.references.map((r, i) => (i === index ? { ...r, url: event.target.value } : r)),
                  })
                }
                className={input}
              />
            </Field>
            {languages.map((language) => (
              <Field key={language} label={t("citationIn", { language: language.toUpperCase() })}>
                <input
                  lang={language}
                  value={reference.citations[language] ?? ""}
                  onChange={(event) =>
                    change({
                      references: form.references.map((r, i) =>
                        i === index ? { ...r, citations: { ...r.citations, [language]: event.target.value } } : r,
                      ),
                    })
                  }
                  className={input}
                />
              </Field>
            ))}
            <button
              type="button"
              onClick={() => change({ references: form.references.filter((_, i) => i !== index) })}
              className={secondary}
            >
              {t("removeReference")}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            change({
              references: [
                ...form.references,
                { url: "", citations: Object.fromEntries(languages.map((language) => [language, ""])) },
              ],
            })
          }
          className={secondary}
        >
          {t("addReference")}
        </button>
      </fieldset>

      {problem && (
        <p role="alert" className="rounded-lg bg-danger-soft p-3 text-danger-ink ring-1 ring-danger-line">
          {problem}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={primary}>
          {id ? t("save") : t("create")}
        </button>
        {id && (
          <button type="button" disabled={busy} onClick={remove} className={danger}>
            {t("delete")}
          </button>
        )}
      </div>
    </form>
  );
}

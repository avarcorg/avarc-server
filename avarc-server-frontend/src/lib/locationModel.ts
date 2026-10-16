export type Position = { kind: string; latitude: number | null; longitude: number | null };
export type Translation = {
  name: string;
  description: string;
  periodLabel: string | null;
  confidenceLevel: number;
};
export type Tag = { key: string; labels: Record<string, string> };
export type Reference = { url: string | null; citations: Record<string, string> };
export type Location = {
  id: string;
  position: Position;
  confidenceLevel: number;
  periodStart: string | null;
  periodEnd: string | null;
  translations: Record<string, Translation>;
  tags: Tag[];
  references: Reference[];
  createdAt: string;
  updatedAt: string;
};

export type TagSummary = { key: string; labels: Record<string, string>; locations: number };

export type Picked<T> = { value: T; language: string; fallback: boolean };

// The entry for the language, else the English one, else the one with the
// lowest language code (the language fallback of the locations spec).
export function pick<T>(entries: Record<string, T>, locale: string): Picked<T> | null {
  if (locale in entries) {
    return { value: entries[locale], language: locale, fallback: false };
  }
  const language = "en" in entries ? "en" : Object.keys(entries).sort()[0];
  return language === undefined ? null : { value: entries[language], language, fallback: true };
}

// The label of a tag in the language, else the key.
export function tagLabel(tag: Tag, locale: string): string {
  return pick(tag.labels, locale)?.value ?? tag.key;
}

// The year of an ISO timestamp, negative before the common era
// ("-0500-01-01T00:00:00Z" is 500 BCE), or null.
export function yearOf(iso: string | null): number | null {
  const match = iso === null ? null : /^(-?)(\d{4,})-/.exec(iso);
  if (match === null) {
    return null;
  }
  const year = Number(match[2]);
  return match[1] === "-" ? -year : year;
}

// ---- The form of a location ------------------------------------------------

export type TextState = { name: string; description: string; periodLabel: string; confidence: string };
export type ReferenceState = { url: string; citations: Record<string, string> };
export type FormState = {
  latitude: string;
  longitude: string;
  confidence: string;
  periodStart: string; // a year; negative before the common era
  periodEnd: string;
  texts: Record<string, TextState>;
  tags: string[];
  references: ReferenceState[];
};

export function emptyForm(languages: string[]): FormState {
  return {
    latitude: "",
    longitude: "",
    confidence: "3",
    periodStart: "",
    periodEnd: "",
    texts: Object.fromEntries(
      languages.map((language) => [language, { name: "", description: "", periodLabel: "", confidence: "3" }]),
    ),
    tags: [],
    references: [],
  };
}

export function formFromLocation(location: Location, languages: string[]): FormState {
  const form = emptyForm(languages);
  form.latitude = String(location.position.latitude ?? "");
  form.longitude = String(location.position.longitude ?? "");
  form.confidence = String(location.confidenceLevel);
  form.periodStart = String(yearOf(location.periodStart) ?? "");
  form.periodEnd = String(yearOf(location.periodEnd) ?? "");
  for (const language of languages) {
    const text = location.translations[language];
    if (text) {
      form.texts[language] = {
        name: text.name,
        description: text.description,
        periodLabel: text.periodLabel ?? "",
        confidence: String(text.confidenceLevel),
      };
    }
  }
  form.tags = location.tags.map((tag) => tag.key);
  form.references = location.references.map((reference) => ({
    url: reference.url ?? "",
    citations: Object.fromEntries(languages.map((language) => [language, reference.citations[language] ?? ""])),
  }));
  return form;
}

// A year as the API's timestamp: the first or the last day of the year.
export function yearToIso(year: number, end: boolean): string {
  const sign = year < 0 ? "-" : "";
  const digits = String(Math.abs(year)).padStart(4, "0");
  return `${sign}${digits}-${end ? "12-31" : "01-01"}T00:00:00Z`;
}

export type FormError = "position" | "year" | "text";
export type RequestBody = {
  position: Position;
  confidenceLevel: number;
  periodStart: string | null;
  periodEnd: string | null;
  translations: Record<string, Translation>;
  tags: string[];
  references: Reference[];
};

const YEAR = /^-?\d{1,4}$/;

// The body of a create or update request, or the kind of mistake the form
// can find by itself. Everything else is checked by the backend, whose
// message is shown as it is.
export function toRequestBody(
  form: FormState,
  languages: string[],
): { body: RequestBody } | { error: FormError } {
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  if (form.latitude.trim() === "" || form.longitude.trim() === "" || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "position" };
  }
  for (const year of [form.periodStart, form.periodEnd]) {
    if (year.trim() !== "" && !YEAR.test(year.trim())) {
      return { error: "year" };
    }
  }
  const translations: Record<string, Translation> = {};
  for (const language of languages) {
    const text = form.texts[language];
    if (text && (text.name.trim() !== "" || text.description.trim() !== "")) {
      translations[language] = {
        name: text.name,
        description: text.description,
        periodLabel: text.periodLabel.trim() === "" ? null : text.periodLabel,
        confidenceLevel: Number(text.confidence),
      };
    }
  }
  if (Object.keys(translations).length === 0) {
    return { error: "text" };
  }
  const references: Reference[] = form.references.flatMap((reference) => {
    const citations = Object.fromEntries(
      Object.entries(reference.citations).filter(([, text]) => text.trim() !== ""),
    );
    return reference.url.trim() === "" && Object.keys(citations).length === 0
      ? []
      : [{ url: reference.url.trim() === "" ? null : reference.url.trim(), citations }];
  });
  return {
    body: {
      position: { kind: "point", latitude, longitude },
      confidenceLevel: Number(form.confidence),
      periodStart: form.periodStart.trim() === "" ? null : yearToIso(Number(form.periodStart), false),
      periodEnd: form.periodEnd.trim() === "" ? null : yearToIso(Number(form.periodEnd), true),
      translations,
      tags: form.tags,
      references,
    },
  };
}

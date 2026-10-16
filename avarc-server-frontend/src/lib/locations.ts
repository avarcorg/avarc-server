import { cookies } from "next/headers";

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
type Page = { items: Location[]; page: number; size: number; total: number };

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
const PAGE_SIZE = 100;

export class NotLoggedIn extends Error {}
export class NotFound extends Error {}

// Asks the backend as the logged-in user: the session cookie of the browser
// request is forwarded as it is.
async function get<T>(path: string): Promise<T> {
  const cookie = (await cookies()).toString();
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: { cookie, accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) {
    throw new NotLoggedIn();
  }
  if (response.status === 404) {
    throw new NotFound();
  }
  if (!response.ok) {
    throw new Error(`The backend answered ${response.status}`);
  }
  return (await response.json()) as T;
}

// Every location, a page at a time of the maximum size.
export async function allLocations(): Promise<Location[]> {
  const first = await get<Page>(`/api/locations?page=0&size=${PAGE_SIZE}`);
  const items = [...first.items];
  for (let page = 1; items.length < first.total && page * PAGE_SIZE < first.total; page++) {
    items.push(...(await get<Page>(`/api/locations?page=${page}&size=${PAGE_SIZE}`)).items);
  }
  return items;
}

export function oneLocation(id: string): Promise<Location> {
  return get<Location>(`/api/locations/${encodeURIComponent(id)}`);
}

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

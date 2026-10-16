import { cookies } from "next/headers";

import type { Location, TagSummary } from "./locationModel";

export * from "./locationModel";

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

// Every tag with its labels and the number of locations that carry it.
export function allTags(): Promise<TagSummary[]> {
  return get<TagSummary[]>("/api/tags");
}

import { cookies } from "next/headers";

export type Me = {
  username: string;
  name: string | null;
  email: string | null;
  roles: string[];
  csrfToken: string;
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// The logged-in user according to the backend, or null without a session.
// The session cookie of the browser request is forwarded as it is.
export async function currentUser(): Promise<Me | null> {
  const cookie = (await cookies()).toString();
  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`The backend answered ${response.status}`);
  }
  return (await response.json()) as Me;
}

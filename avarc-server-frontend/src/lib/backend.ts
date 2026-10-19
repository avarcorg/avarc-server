import { headers } from "next/headers";

import { log } from "./log";
import { observeBackendCall } from "./metrics";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Calls the backend from the server. The request ID that the ingress created
// for the browser request goes along, so that both services log the same ID.
// The caller adds the session cookie it forwards.
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const requestId = (await headers()).get("x-request-id");
  const requestHeaders = new Headers(init.headers);
  if (requestId) {
    requestHeaders.set("x-request-id", requestId);
  }
  const route = path.split("?")[0];
  const started = performance.now();
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: requestHeaders,
      cache: "no-store",
    });
    observeBackendCall(String(response.status), (performance.now() - started) / 1000);
    if (response.status >= 500) {
      log("WARN", `The backend answered ${response.status}`, { request_id: requestId, path: route });
    }
    return response;
  } catch (error) {
    observeBackendCall("error", (performance.now() - started) / 1000);
    log("ERROR", "The backend cannot be reached", {
      request_id: requestId,
      path: route,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

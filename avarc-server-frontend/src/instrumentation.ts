import type { Instrumentation } from "next";

// Runs once when the server starts. The metrics port is set by the
// deployment; without it (development) no metrics are served.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const port = Number(process.env.METRICS_PORT);
  if (!port) return;
  const { startMetricsServer } = await import("./lib/metricsServer");
  startMetricsServer(port);
}

// A request that failed in the server: logged with the request ID of the
// ingress and counted.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { log } = await import("./lib/log");
  const { observeRenderError } = await import("./lib/metrics");
  const requestId = request.headers["x-request-id"];
  observeRenderError(context.routeType);
  log("ERROR", error instanceof Error ? error.message : String(error), {
    request_id: Array.isArray(requestId) ? requestId[0] : requestId,
    path: request.path.split("?")[0],
    route: context.routePath,
    kind: context.routeType,
    digest: (error as { digest?: string }).digest,
  });
};

// The counters of the server side. They live on globalThis because Next may
// load this module more than once (instrumentation, pages, route handlers)
// in the same process. The text format is served by metricsServer.ts.
const BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

type Store = {
  backendCalls: Map<string, number>;
  backendBuckets: number[];
  backendSum: number;
  backendCount: number;
  renderErrors: Map<string, number>;
};

const holder = globalThis as unknown as { __avarcMetrics?: Store };
const store: Store = (holder.__avarcMetrics ??= {
  backendCalls: new Map(),
  backendBuckets: BUCKETS.map(() => 0),
  backendSum: 0,
  backendCount: 0,
  renderErrors: new Map(),
});

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

// A call to the backend: the status, or "error" when it did not answer.
export function observeBackendCall(status: string, seconds: number) {
  increment(store.backendCalls, status);
  store.backendCount += 1;
  store.backendSum += seconds;
  BUCKETS.forEach((bound, i) => {
    if (seconds <= bound) store.backendBuckets[i] += 1;
  });
}

// A request that failed in the server: the kind is Next's route type
// (render, route, action, proxy).
export function observeRenderError(kind: string) {
  increment(store.renderErrors, kind);
}

export function renderApplicationMetrics(): string {
  const lines: string[] = [];
  lines.push("# TYPE frontend_backend_requests_total counter");
  for (const [status, n] of store.backendCalls) {
    lines.push(`frontend_backend_requests_total{status="${status}"} ${n}`);
  }
  lines.push("# TYPE frontend_backend_request_duration_seconds histogram");
  BUCKETS.forEach((bound, i) => {
    lines.push(`frontend_backend_request_duration_seconds_bucket{le="${bound}"} ${store.backendBuckets[i]}`);
  });
  lines.push(`frontend_backend_request_duration_seconds_bucket{le="+Inf"} ${store.backendCount}`);
  lines.push(`frontend_backend_request_duration_seconds_sum ${store.backendSum}`);
  lines.push(`frontend_backend_request_duration_seconds_count ${store.backendCount}`);
  lines.push("# TYPE frontend_render_errors_total counter");
  for (const [kind, n] of store.renderErrors) {
    lines.push(`frontend_render_errors_total{kind="${kind}"} ${n}`);
  }
  return lines.join("\n") + "\n";
}

import { createServer } from "node:http";
import { monitorEventLoopDelay } from "node:perf_hooks";

import { renderApplicationMetrics } from "./metrics";

// Serves the metrics in the Prometheus text format on a port of its own, which
// the ingress does not route (spec/SPEC-observability.md).
export function startMetricsServer(port: number) {
  const loop = monitorEventLoopDelay();
  loop.enable();
  const started = Date.now() / 1000;
  createServer((request, response) => {
    if (request.url !== "/metrics") {
      response.writeHead(404).end();
      return;
    }
    const cpu = process.cpuUsage();
    const body =
      renderApplicationMetrics() +
      `process_start_time_seconds ${started}\n` +
      `process_cpu_seconds_total ${(cpu.user + cpu.system) / 1e6}\n` +
      `process_resident_memory_bytes ${process.memoryUsage().rss}\n` +
      `nodejs_eventloop_delay_mean_seconds ${loop.mean / 1e9}\n`;
    response.writeHead(200, { "content-type": "text/plain; version=0.0.4" }).end(body);
  }).listen(port);
}

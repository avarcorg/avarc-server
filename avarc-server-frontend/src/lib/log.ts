// One JSON object per line on standard output, with the fields shared by all
// services (spec/SPEC-observability.md). Never pass cookies, tokens or
// personal data in the fields.
export type Level = "ERROR" | "WARN" | "INFO";

export function log(level: Level, message: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "frontend",
    ...fields,
    message,
  });
  if (level === "ERROR") {
    console.error(line);
  } else {
    console.log(line);
  }
}

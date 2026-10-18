// The health check of the container (see spec/SPEC-observability.md): it
// answers when the server runs. No data and no login.
export function GET() {
  return Response.json({ status: "UP" });
}

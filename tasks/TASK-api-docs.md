---
id: AVARC-34
type: task
status: open
priority: normal
area: backend
depends-on: [AVARC-3, AVARC-33]
created: 2026-10-15
---

# TASK: Expose the API description and Swagger UI on dev and stage

Spec: [SPEC-backend.md](../spec/SPEC-backend.md) (API: REST and OpenAPI,
generated from the code with springdoc),
[SPEC-ingress.md](../spec/SPEC-ingress.md)

The backend API is described by an OpenAPI document and browsable in
Swagger UI, in the dev and stage environments, without authentication. Prod
has neither.

- Add springdoc (the release that supports the Spring Boot version of the
  parent POM; verify it at implementation time) to the backend.
- Serve the OpenAPI document and Swagger UI under `/api/` (for example
  `/api/docs` and `/api/docs/openapi.json`, set with the springdoc
  properties), so the ingress already routes them to the backend, the
  prefix stays reserved for the backend, and no ingress or frontend change
  is needed. Check the final paths against the ingress routing.
- Enable them in the `dev` and `stage` profiles only
  (`application-dev.properties`, `application-stage.properties`), like the
  actuator endpoints; `application.properties` disables them, so prod serves
  neither document nor UI.
- Those paths are open (`permitAll`) in the security configuration, but only
  where springdoc is enabled; in prod they must not be open even if
  enabled by mistake. Everything else stays authenticated as before.
- Give the document a title, description and version, group the existing
  endpoints (hello, auth) and describe the session cookie and CSRF token
  that the API expects, so that calls from Swagger UI are explained.
- Open question, decide at the start and record in the spec: does "no
  authentication necessary" cover only reading the document and the UI, or
  should "Try it out" calls to the other endpoints work without a login on
  dev and stage too? Default: only the document and the UI are open; the
  calls use the session of a login in the same browser (same origin), with
  the CSRF token from `GET /api/auth/me`. Opening the endpoints themselves
  would be a larger change of the security model and would need its own
  decision.
- Tests: in the `dev` profile the document and the UI answer without a login
  and the document lists the existing endpoints; without the profile
  (default and prod) they answer 401 or 404, and the endpoints stay
  protected.
- Specify the result (backend spec, and the ingress spec if the paths
  matter there) and update `AGENTS.md`.

## Verification

On the developer deployment and on stage (built on its host, see
[SPEC-releases.md](../spec/SPEC-releases.md)): the UI loads through the
ingress without a login, the document lists the endpoints, a call from the
UI works after a login as decided above. With `SPRING_PROFILES_ACTIVE`
unset or `prod`, document and UI are not served.

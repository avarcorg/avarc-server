---
id: AVARC-34
type: task
status: in-progress
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
- Decided (by the maintainer, 2026-10-15) and recorded in the spec: "no
  authentication necessary" covers only reading the document and the UI.
  "Try it out" calls use the session of a login in the same browser (same
  origin), with the CSRF token from `GET /api/auth/me`. Opening the
  endpoints themselves would be a larger change of the security model and
  would need its own decision.
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

## Progress

Implemented with springdoc 3.1.1 (the version is the property
`springdoc.version` of the backend POM): the paths are `/api/docs` (redirects
to Swagger UI), `/api/docs/openapi.json`, and the UI assets and
configuration under `/api/swagger-ui/` and `/api/docs/openapi.json/swagger-config`,
so everything is under `/api/`; the open paths of the security configuration
cover exactly these, only where `springdoc.swagger-ui.enabled` is true. The
validator URL is empty, so the page calls no external service. Tests cover
dev, stage and the default profile (401 without and 404 with a login).

Verified on the developer deployment through the nginx ingress after a
`reset`: UI, assets, document and configuration answer 200 without a login,
`/api/hello` and `/api/auth/me` still 401.

Open: a call from the UI after a login ("Try it out" with the session and
CSRF token), to be tried in a browser; the same on stage after it is
deployed.

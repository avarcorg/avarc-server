---
id: AVARC-33
type: task
status: in-progress
priority: normal
area: ingress
depends-on: [AVARC-8, AVARC-31, AVARC-32]
created: 2026-10-15
---

# TASK: Custom ingress image

Spec: [SPEC-ingress.md](../spec/SPEC-ingress.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md),
[SPEC-releases.md](../spec/SPEC-releases.md)

Today the `ingress` service runs the stock Caddy image and gets the routing
at start from `deploy/Caddyfile`, mounted from the host and installed on
each host by `deploy/deploy.sh`. Build an image that holds the routing
configuration, so that a host needs only the image, and the image is
versioned, built and published like the other images
([AVARC-31](finished/TASK-image-builds.md),
[AVARC-32](TASK-keycloak-image.md)). Unlike the Keycloak image, this one
should be built with Paketo buildpacks through the shared `pack`
configuration of the parent POM, using a Paketo managed web server, and the
product may change for that.

- Investigate first. The Paketo web server buildpacks are for nginx and
  Apache httpd; Caddy has no buildpack. Find out whether Caddy can be kept
  (a custom buildpack, or no `pack` build) or whether the ingress switches
  to nginx or httpd. Weigh the shared build path (and one more image built
  like the rest) against Caddy's small configuration, and against the
  decision of [AVARC-8](finished/TASK-ingress-decision.md), which chose
  Caddy. Record the finding and the decision in this task and in
  `spec/SPEC-ingress.md` before implementing; if the product changes, the
  decision section of the spec changes with it.
- The routing of the spec stays as it is, whatever the product (check each
  point against its configuration):
  - `/api/` and `/actuator/` to `backend:8080`, everything else to
    `frontend:3000`; `/auth/realms/avarc/*` and `/auth/resources/*` to
    `keycloak:8080` without prefix stripping, any other `/auth/*` answers
    404;
  - TLS is terminated before the ingress; the forwarded headers of
    private-range hops are trusted and passed on unchanged, so the
    upstreams see the original scheme and host;
  - the ingress does not enforce authentication and passes cookies and
    credentials unchanged;
  - `/actuator/` stays reachable in dev and stage and is disabled in prod
    (the placeholder of the current configuration).
- Check the points where the web server buildpacks differ: the port it
  listens on (the Compose project and docktail labels use port 80 and the
  loopback ingress port), how the configuration is supplied (a file in the
  application directory, templating of upstream hostnames if needed), the
  run image and its user, proxy buffering and timeouts, request body
  limits, and how the logs reach the container's output.
- Nothing environment-specific or secret is baked in; hostnames of the
  upstreams are the service names of the Compose project.
- The image is built by the `-Pwith-docker` Maven build, as a module of its
  own, tagged `<image.namespace>/avarc-ingress:<version>` and published by
  the CI Build workflow and `tools/publish-images.sh` with the other
  images. Whatever pins the web server (a buildpack environment variable or
  a version in the configuration) is one place that Renovate can update, or
  is noted in the task if it cannot.
- The Compose template runs this image (`INGRESS_VERSION`, defaulted like
  `BACKEND_VERSION`) and drops the file mount; `deploy/deploy.sh` stops
  copying the configuration.
- Keep working: the published port and the docktail labels, the dependency
  on the other services, and the routing described above.
- Update the observability tasks if they assume the old product
  ([AVARC-24](TASK-observability-ingress-database.md)).
- Specify the result (ingress, deployment and releases specs) and update
  `AGENTS.md`.

## Verification

On the developer deployment, from a fresh start (`deploy/run.sh reset`):
the routes of the spec answer as before (frontend page, `/api/hello` with and
without a login, `/actuator/health`, the Keycloak realm endpoints, `404`
for the admin console, the `master` realm and traversal attempts under
`/auth/`), the login and logout of
[AVARC-29](finished/TASK-backend-login.md) work through the new ingress, and
the forwarded scheme reaches Keycloak. Then the image runs on stage, built
on its host: pulling the published image from the registry has to wait (see
[SPEC-releases.md](../spec/SPEC-releases.md)).

## Progress

Decision (by the maintainer): switch to nginx, built with the Paketo nginx
buildpack through the shared `pack` configuration; the module is
`avarc-server-ingress`, the specs and `AGENTS.md` are updated, and the
Caddyfile is gone.

Findings with the buildpack (`paketobuildpacks/ubuntu-noble-builder`):
- Do not set `BP_WEB_SERVER`: the buildpack then generates its own
  static-file configuration over `nginx.conf` (everything answered 404).
  The `nginx.conf` in the application directory is enough for detection.
- Setting `BP_NGINX_VERSION` (also with a wildcard) makes its detection
  fail, so the version is the buildpack's choice (1.31.6 at the time) and
  follows the builder; Renovate cannot pin it.
- The launch command already sets `pid`, and this nginx has no `uwsgi` and
  `scgi` modules, no `mime.types` in the application directory; the
  configuration must not use them. `{{port}}` is filled in at start
  (default 8080); the user is unprivileged, so port 80 is out.
- A `proxy_pass` with variables and no URI passes the request unchanged and
  needs `resolver 127.0.0.11`; it makes the upstreams resolved per request.
  A prefix location with `proxy_pass` redirects the bare prefix, hence the
  exact `404` locations for `/auth/realms/avarc` and `/auth/resources`.

Verified on the developer deployment from a fresh `reset` (Compose now runs
`avarc-ingress:${INGRESS_VERSION}`, port 8080 inside): frontend 307,
`/api/hello` 401, `/actuator/health` and `/actuator` 200, the realm
discovery 200, 404 for the admin console, the `master` realm, `/auth/` and
traversal attempts (plain, `%2e%2e`, `..%2f`, double slash), the backend's
login redirecting to the realm. With an echo service in place of the
backend, a request from a private hop passed `X-Forwarded-Proto`,
`X-Forwarded-Host`, `X-Forwarded-For` (extended), `Host`, cookies, the
authorization header and the path unchanged.

Stage (version `v0.1.0-75-g61b1094`, images built on the host): the routes
answer as on dev, also through the tailnet names, the ingress log has no
errors, and a browser login and logout work (confirmed by the maintainer on
2026-10-15).

Untrusted hop, checked on dev with an echo service as the backend: a request
to the ingress through the host's tailnet address (`100.x`, not a private
range) with forged `X-Forwarded-Proto: https`, `-Host: evil.example` and
`-For: 1.2.3.4` reached the upstream with `http`, the real `Host` and only
the peer address; the same request through `localhost` (a private peer)
passed the forged values on unchanged.

Registry (checked 2026-10-15): the CI Build of `be179d8` published
`ghcr.io/avarcorg/avarc-ingress` with the tags `snapshot` and
`sha-be179d8` (private, like the other packages).

Open: running the *published* image on stage, which waits (see
[SPEC-releases.md](../spec/SPEC-releases.md)).
[AVARC-24](TASK-observability-ingress-database.md) names no product, so it
needs no change.

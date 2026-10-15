---
id: AVARC-32
type: task
status: in-progress
priority: normal
area: auth
depends-on: [AVARC-20, AVARC-31]
created: 2026-10-15
---

# TASK: Custom Keycloak image

Spec: [SPEC-auth.md](../spec/SPEC-auth.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md),
[SPEC-releases.md](../spec/SPEC-releases.md)

Today the `keycloak` service runs the stock image and gets this project's
customizations at start from files mounted from the host: the entrypoint
`deploy/keycloak-start.sh` and the realm import `deploy/keycloak/avarc-realm.json`,
installed on each host by `deploy/deploy.sh`. Build an image that holds all
of them, so that a host needs only the image and its secrets, and the image
is versioned, built and published like the backend and the frontend
([AVARC-31](finished/TASK-image-builds.md)).

- The image is based on the pinned Keycloak image and contains:
  - the realm import file, still free of secrets and with its placeholders
    (public origin, client secret) resolved at start;
  - the start script as the entrypoint, still reading the secrets from
    `/run/secrets` and starting Keycloak in production mode;
  - the build-time options of Keycloak (database vendor, health endpoints,
    the `/auth` relative path), applied with `kc.sh build` so that the start
    uses `--optimized` and is faster;
  - anything else this project customizes, such as the health check, if it
    moves from the Compose file into the image.
- Nothing environment-specific or secret is baked in: the hostnames, the
  database address and every secret stay runtime configuration.
- The image is built by the `-Pwith-docker` Maven build, as a module of its
  own, tagged `<image.namespace>/avarc-keycloak:<version>` and
  published by the CI Build workflow and `tools/publish-images.sh` with the
  other images. The Keycloak version is one property that Renovate can
  update.
- Investigate first how to build it: the other images are built with `pack`
  and Paketo buildpacks through the shared configuration of the parent POM,
  and there is no buildpack for Keycloak. Find out whether `pack` can still
  be used (a custom buildpack or builder, or `pack` on top of the Keycloak
  image) or whether a Dockerfile built with `docker build` is the sensible
  exception. Record the finding and the decision in the task and in the
  specs before implementing, weighing one shared build path against
  simplicity for a non-developer maintainer.
- The Compose template runs this image (`KEYCLOAK_VERSION`, defaulted like
  `BACKEND_VERSION`) and drops the two file mounts; `deploy/deploy.sh` stops
  copying `keycloak-start.sh` and the realm file.
- Keep working: the container user that can read the secrets, the loopback
  admin port and the docktail labels, the ingress routing, and the account
  scripts. A change of the realm file still reaches only a new realm
  (documented in `AGENTS.md`); say in the specs that it now ships with a new
  image version.
- Specify the result (auth, deployment and releases specs) and update
  `AGENTS.md`.

## Verification

On the developer deployment, from a fresh start (`deploy/run.sh reset`):
Keycloak starts from the image alone, the realm is imported, the accounts
script creates the admin, and the login and logout of
[AVARC-29](finished/TASK-backend-login.md) work. Then the image runs on
stage. Pulling the published image from the registry on stage has to wait,
so stage runs the image built on its host.

## Progress

Decision: a Dockerfile built with `docker build` (module
`avarc-server-keycloak`, `-Pwith-docker`), not `pack`. Paketo with a
`Procfile` was tried: with the Java and Procfile buildpacks it builds and,
on the full `ubuntu-noble-run` image (the tiny one has no `bash`), runs
Keycloak, but needs the distribution downloaded into the build, cannot run
`kc.sh build` (the start then fails with `--optimized`, or is slow without
it) and puts the version in a Maven property. The Keycloak version is the
tag in the `FROM` line, which Renovate tracks natively. The health check
stays in the Compose file.

Done and verified on the developer deployment from a fresh `reset`: Keycloak
starts from the image alone (optimized, up in about 2 s), imports the realm,
the admin script creates the admin, and the backend's login redirects to the
realm. The image carries the source label. Compose, `deploy.sh`, `run.sh`
(`KEYCLOAK_VERSION`), `tools/publish-images.sh`, the CI label step and the
docs are updated.

Stage (checked after the push of this change, version
`v0.1.0-68-gad13425`): the `keycloak` service runs the image built on the
host (`avarcorg/avarc-keycloak:0.1.0-SNAPSHOT`), is healthy, and through the
ingress the realm discovery answers 200 and the `master` admin console 404.
The same image therefore works on stage, without the file mounts.

Open: a full browser login and logout on the new image. Running the
*published* image on stage waits, because pulling from the registry has to
wait (see [SPEC-releases.md](../spec/SPEC-releases.md)).

---
id: AVARC-32
type: task
status: open
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
[AVARC-29](finished/TASK-backend-login.md) work. Then the published image
runs on stage.

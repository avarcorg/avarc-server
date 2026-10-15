# SPEC: Deployment

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define how the application is run as a whole. The first deployment is for
developers; other environments are specified when needed.

## Requirements

- The whole application runs as one Docker Compose project: ingress,
  frontend, backend, Keycloak and the database.
- It is easy to bring up and to reset to a clean state, with all data local
  to the checkout.
- Secrets are never committed and never printed.

## Decisions (developer deployment)

Introduced in [AVARC-18](../tasks/finished/TASK-deployment-setup.md).

- **Files:** everything lives in `deploy/`: `docker-compose.template`,
  `run.sh` and the systemd units `systemd/avarc-stage.service`
  and `systemd/avarc-prod.service`, each running as its own user and group from that
  user's home directory (`/home/avarc-<environment>`). On the host,
  `deploy/deploy.sh stage|prod` (root only) installs them from a checkout:
  it copies the unit to `/etc/systemd/system` and `run.sh`, the account scripts and
  the template together into the home directory, then reloads systemd. It never starts
  the service and never touches data or secrets. It records the version of
  the checkout (`git describe --tags`) in `VERSION` next to the files and
  prints it; for prod it refuses a checkout that is not exactly a release tag
  (see [SPEC-releases.md](SPEC-releases.md)) or has uncommitted changes. `run.sh` renders the template with `envsubst` into `docker-compose.yml`
  (gitignored, mode 0600) at every start; `$$` is a literal dollar.
- **Environments:** `dev`, `stage` and `prod`. `run.sh --stage` selects
  stage (the systemd unit on the staging host passes it); without it the
  environment is dev. `SECRETS=dev|stage|prod` overrides this and is how
  prod is selected (the prod unit sets `SECRETS=prod`). The environment
  names the Compose project (`avarc-<environment>`), the data directory and
  the default ingress port (8080 dev, 8081 stage, 8082 prod; `INGRESS_PORT`
  overrides), so environments can run side by side.
- **Start and stop:** `deploy/run.sh [--stage] up` runs the project in
  the foreground, as systemd expects (`up -d` detaches), `down` stops it
  keeping data, any other argument is passed to `docker compose`. `reset`
  (dev only) stops the project and deletes its local data and generated
  secrets. Without arguments, or with `--help`, it prints the usage.
- **Entry point:** the ingress is published on the environment's port on
  localhost. It carries docktail labels that expose it on the tailnet as
  `avarc-<environment>` on port 443, where docktail terminates TLS; the
  ingress itself does not.
- **Data:** bind-mounted under `deploy/data/<environment>/` (gitignored).
- **Secrets:** their values are in `deploy/secrets.dev.sh` (dev; generated
  with random values on the first start), `deploy/secrets.stage.sh` or
  `deploy/secrets.sh` (prod), all gitignored and exporting one variable per
  secret. `run.sh` reads each needed secret from that file in an isolated
  shell, writes one file per secret into a directory in memory
  (`/dev/shm/avarc-<environment>-secrets`, mode 0700), and mounts it
  read-only at `/run/secrets` in the containers that need it. Secrets are
  not passed as environment variables; a start with a missing value fails
  naming it. `run.sh` keeps shell tracing off while it handles values.
- **Accounts:** the secrets file also holds the credentials of the initial
  accounts (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `EDITOR_*` and
  `VIEWER_*` pairs). These are read only by `deploy/create-admin-user.sh`, never
  mounted into containers. The dev secrets file gets an admin account
  with a random password when it is generated.
- **Other configuration:** non-secret variables (for example
  `INGRESS_PORT`, and `PUBLIC_ORIGIN`, the externally visible origin, which
  defaults to `https://avarc-<environment>.<tailnet domain>`, the domain being
  that of the tailnet the host is in, and without a tailnet to
  `http://localhost:<ingress port>` for dev) are exported by `run.sh` and referenced in `compose.yaml`.
- **Host settings:** `IMAGE_NAMESPACE` and the `*_VERSION` variables (the
  images to run) are taken from the environment if set there, otherwise
  from the environment's secrets file (an exported variable of that name,
  read in the same isolated shell), otherwise from the defaults of
  `run.sh`. This lets a host name its own registry or mirror in a file that
  is never committed, with no change to the systemd unit or this
  repository.
- **Image pull:** `run.sh up` first pulls the images when `IMAGE_NAMESPACE`
  names a registry (it contains a `/`, like `ghcr.io/avarcorg`); with the
  default namespace the images are the ones built on the host and nothing is
  pulled. A failed pull is tried again a few times with a pause in between
  (4 attempts, 15 seconds; `PULL_ATTEMPTS` and `PULL_RETRY_DELAY` change
  that). When the last attempt fails, `run.sh` stops with a message before
  anything is started, and the service manager's own restart tries again later.
- **Updating stage:** stage runs the moving tag `snapshot` of the four images
  (the latest build of `main`). An update is a restart of the service: the
  stack stops, `run.sh up` pulls the new images and starts them, and the
  checks are `/actuator/health` (200), `/api/hello` (401 without a login),
  the realm endpoint (200) and the origin (307). A rollback sets the four
  `*_VERSION` variables of the host to `sha-<commit>` of the earlier build
  and restarts; going back to `snapshot` removes them again. Prod does not
  follow this: it runs release tags only (see
  [SPEC-releases.md](SPEC-releases.md)).
- **Keycloak admin console:** the `keycloak` service carries docktail labels
  that expose it on the tailnet as `avarc-<environment>-kc` on port 443,
  where docktail terminates TLS. Admins reach the console of the `avarc`
  realm at
  `https://avarc-<environment>-kc.<tailnet domain>/auth/admin/avarc/console/`
  (`KEYCLOAK_ADMIN_ORIGIN` overrides the address). The `master` realm
  administrator is `keycloak-admin` with the secret
  `KEYCLOAK_ADMIN_PASSWORD`. The ingress does not route any of this. The
  service also publishes its port on `127.0.0.1` only (8180 dev, 8181
  stage, 8182 prod; `KEYCLOAK_ADMIN_PORT` overrides), which
  the account scripts use.
- **Backend service:** runs the image built by the backend
  ([SPEC-backend.md](SPEC-backend.md)), image
  `<IMAGE_NAMESPACE>/avarc-backend:<BACKEND_VERSION>`. `run.sh`
  defaults `IMAGE_NAMESPACE` to `avarcorg` and `BACKEND_VERSION` to the
  version of the Maven build (`0.1.0-SNAPSHOT`), and the environment
  overrides both (set `BACKEND_VERSION` to a release version to run a
  release, and `IMAGE_NAMESPACE=ghcr.io/avarcorg` to run the published
  images, see [SPEC-releases.md](SPEC-releases.md)). The Spring profile named after the environment is active
  (`SPRING_PROFILES_ACTIVE`); it has no published port, the ingress reaches
  it by service name. It gets `PUBLIC_ORIGIN` and, mounted as a file, only
  the secret `KEYCLOAK_CLIENT_SECRET` (not the whole secrets directory);
  `KEYCLOAK_INTERNAL_URL` (default `http://keycloak:8080/auth/realms/avarc`)
  overrides the address at which it reaches Keycloak.
- **Frontend service:** runs the image built by the frontend
  ([SPEC-frontend.md](SPEC-frontend.md)), image
  `<IMAGE_NAMESPACE>/avarc-frontend:<FRONTEND_VERSION>`, versioned
  like the backend (`FRONTEND_VERSION`); it has no published port, the
  ingress reaches it as `frontend:3000`. `BACKEND_URL` (`http://backend:8080`)
  is the address at which its server side reaches the backend.
- **Ingress service:** runs the image of the module `avarc-server-ingress`
  ([SPEC-ingress.md](SPEC-ingress.md)), image
  `<IMAGE_NAMESPACE>/avarc-ingress:<INGRESS_VERSION>`, versioned like the
  backend (`INGRESS_VERSION`). The container listens on port 8080, published
  as `INGRESS_PORT` and exposed by docktail; the routing is part of the
  image.
- **Keycloak service:** runs the image of the module `avarc-server-keycloak`
  ([SPEC-auth.md](SPEC-auth.md)), image
  `<IMAGE_NAMESPACE>/avarc-keycloak:<KEYCLOAK_VERSION>`, versioned like the
  backend (`KEYCLOAK_VERSION`, defaulted by `run.sh` to the version of the
  Maven build). A host needs the image and the secrets directory only; the
  start script and the realm import are in the image.
- **Database image:** PostGIS, as chosen in
  [SPEC-backend.md](SPEC-backend.md).

## Open questions

- Deployment target and environments beyond the developer deployment.

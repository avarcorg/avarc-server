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

- **Files:** everything lives in `deploy/`: `docker-compose.template`, the
  ingress `Caddyfile`, `run.sh` and the systemd units `systemd/avarc-stage.service`
  and `systemd/avarc-prod.service`, each running as its own user and group from that
  user's home directory (`/home/avarc-<environment>`). On the host,
  `deploy/deploy.sh stage|prod` (root only) installs them from a checkout:
  it copies the unit to `/etc/systemd/system` and `run.sh`, the account scripts,
  the template, the `Caddyfile`, `keycloak-start.sh` and the realm import
  together into the home directory, then reloads systemd. It never starts
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
  `<IMAGE_NAMESPACE>/avarc-server-backend:<BACKEND_VERSION>`. `run.sh`
  defaults `IMAGE_NAMESPACE` to `avarcorg` and `BACKEND_VERSION` to the
  version of the Maven build (`0.1.0-SNAPSHOT`), and the environment
  overrides both (set `BACKEND_VERSION` to a release version to run a
  release). The Spring profile named after the environment is active
  (`SPRING_PROFILES_ACTIVE`); it has no published port, the ingress reaches
  it by service name.
- **Frontend service:** runs the image built by the frontend
  ([SPEC-frontend.md](SPEC-frontend.md)), image
  `<IMAGE_NAMESPACE>/avarc-server-frontend:<FRONTEND_VERSION>`, versioned
  like the backend (`FRONTEND_VERSION`); it has no published port, the
  ingress reaches it as `frontend:3000`.
- **Database image:** PostGIS, as chosen in
  [SPEC-backend.md](SPEC-backend.md).

## Open questions

- Where the backend and frontend images are published for stage and prod is
  not decided.
- Deployment target and environments beyond the developer deployment.

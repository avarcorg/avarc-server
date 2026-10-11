# SPEC: Deployment

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define how the application is run as a whole. The first deployment is for
developers; other environments are specified when needed.

## Requirements

- The whole application runs as one Docker Compose project: ingress,
  frontend, backend, Ory and the database.
- It is easy to bring up and to reset to a clean state, with all data local
  to the checkout.
- Secrets are never committed and never printed.

## Decisions (developer deployment)

Introduced in [AVARC-18](../tasks/finished/TASK-deployment-setup.md).

- **Files:** everything lives in `deploy/`: `docker-compose.template`, the
  ingress `Caddyfile`, `run.sh` and the systemd units `avarc-stage.service`
  and `avarc-prod.service`, each running as its own user and group from that
  user's home directory (`/home/avarc-<environment>`). `run.sh` renders the template with `envsubst` into `docker-compose.yml`
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
- **Other configuration:** non-secret variables (for example
  `INGRESS_PORT`) are exported by `run.sh` and referenced in `compose.yaml`.
- **Database image:** PostGIS, provisionally, until the database choice in
  [SPEC-backend.md](SPEC-backend.md) is made.

## Open questions

- Backend, frontend and Ory services are added to the project once their
  skeletons and the Ory design exist; the ingress already routes to them.
- Deployment target and environments beyond the developer deployment.

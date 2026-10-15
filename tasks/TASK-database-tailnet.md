---
id: AVARC-38
type: task
status: open
priority: low
area: project
depends-on: [AVARC-18]
created: 2026-10-15
---

# TASK: Optionally expose the database on the tailnet (dev and stage)

Spec: [SPEC-deployment.md](../spec/SPEC-deployment.md)

For inspecting data and debugging with a SQL client, the PostGIS database of
dev and stage can be reached from the tailnet, like the Keycloak admin
console already is. It is off by default, an explicit opt-in per
environment, and never available on prod. Keep the task generic: no host
names, tailnet names or addresses in the repository.

## Suggested implementation

- **Mechanism:** docktail labels on the `db` service in
  `deploy/docker-compose.template`, as for `keycloak`, but for a TCP
  service: name `${NAME}-db`, container port 5432, service port 5432. The
  protocol label is TCP, with docktail terminating TLS if it offers that
  (`tls-terminated-tcp`), otherwise plain TCP; check the docktail
  documentation for the exact label values before relying on this. The
  database keeps no published host port.
- **Opt-in:** a variable `DB_TAILNET` (`true` or unset) in the secrets file
  of the environment, written into the label value by the template, e.g.
  `docktail.service.enable=${DB_DOCKTAIL_ENABLE}` with `false` as the
  default. The service is reachable only when the variable is `true`.
- **Never prod:** `run.sh` forces the label to `false` when the environment
  is `prod` and prints a warning if `DB_TAILNET` is set there, so the
  template and the compose file for prod cannot carry the exposure. The
  prod rule goes into the deployment spec in one sentence.
- **Access control:** the database password stays the gate; tailnet access
  rules limit who may reach the service (kept in private documentation).
  Postgres should require a password for connections from the tailnet
  (the image's default `pg_hba.conf` does for non-local addresses). Add a
  read-only role for inspection, created by a script like
  `deploy/create-user.sh` and printing a random password once, so that
  nobody needs the application's own credentials; the application role is
  not handed out.
- **Docs:** one paragraph in `spec/SPEC-deployment.md` (opt-in, dev and
  stage only, not prod, read-only role) and a line in `AGENTS.md`'s
  deployment section on how to turn it on and connect.

## Reopened: a web database tool

Reopened to add a web-based database tool next to the exposed port. When
`DB_TAILNET=true`, `run.sh up` starts the tool as a further service of the
Compose project; without the variable it is not started at all (not just
hidden), and on prod it is never started, by the same rule as the port.

- **Tool:** decided in the specification phase, with a view to the data
  here: PostGIS geometries. A candidate is pgAdmin, which can show geometry
  columns on a map; lighter candidates are Adminer and CloudBeaver. The
  spec records the choice and why, and the image is pinned like the others.
- **Reaching it:** served on the tailnet through docktail as
  `${NAME}-dbadmin` (HTTPS on 443), like the Keycloak console, with no
  published host port and not routed by the ingress.
- **Access:** it connects with the read-only role of
  `deploy/create-db-user.sh`, never the application's role; the role's
  password is entered by the person using the tool, or provided to the tool
  as a file secret if it supports that (never an environment variable, see
  [SPEC-deployment.md](../spec/SPEC-deployment.md)). The tool has its own
  login if it offers one, and its state (saved servers, settings) lives
  under `deploy/data/<environment>/` or in a volume that `reset` removes.
  Keycloak's database stays closed to the role unless `--keycloak` opened it.
- **Docs:** the same paragraph of the deployment spec and the same line of
  `AGENTS.md` cover it: how to turn it on and the address.

## Verification

With `DB_TAILNET=true` on dev: a SQL client on the tailnet connects to
`avarc-dev-db` on port 5432 with the read-only role and can read but not
write. Without the variable the service is not listed on the tailnet. On
prod, with the variable set, `run.sh up` warns and the service is not
exposed. `tools/shellcheck.sh` stays clean.

With the tool: on dev with `DB_TAILNET=true`, the tool opens on the tailnet,
connects with the read-only role and reads but cannot write. Without the
variable, and on prod with the variable set, no tool container is started.

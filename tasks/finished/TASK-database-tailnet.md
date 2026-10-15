---
id: AVARC-38
type: task
status: finished
priority: low
area: project
depends-on: [AVARC-18]
created: 2026-10-15
---

# TASK: Optionally expose the database on the tailnet (dev and stage)

Spec: [SPEC-deployment.md](../../spec/SPEC-deployment.md)

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

## Verification

With `DB_TAILNET=true` on dev: a SQL client on the tailnet connects to
`avarc-dev-db` on port 5432 with the read-only role and can read but not
write. Without the variable the service is not listed on the tailnet. On
prod, with the variable set, `run.sh up` warns and the service is not
exposed. `tools/shellcheck.sh` stays clean.

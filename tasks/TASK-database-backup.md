---
id: AVARC-48
type: task
status: in-progress
priority: normal
area: project
depends-on: [AVARC-18]
created: 2026-10-16
---

# TASK: Back up the database

Spec: [SPEC-deployment.md](../spec/SPEC-deployment.md)

The PostgreSQL database holds the locations, the user records and, for
Keycloak, the accounts and credential hashes. Nothing backs it up today, so a
lost volume or a bad migration loses the data. This task adds a nightly
logical backup on every environment that holds data worth keeping (stage and
prod; dev may run it by hand), and a restore procedure that has been tried.

## Approach

- **Logical dump, not a copy of the data directory.** A file-level copy of a
  running PostgreSQL data directory is not guaranteed to be consistent.
  `pg_dump` in the custom format (`-Fc`) is, restores selectively, and does
  not depend on the host.
- **`pg_dump` runs inside the running `db` container**, as the database's own
  account on the local socket (as `deploy/create-db-user.sh` does), so it
  always matches the PostgreSQL version that is running and needs no client
  on the host and no password.
- **Both databases:** `avarc` (the application's schema `avarc`, and the
  schema `legacy` when an export was imported) and `keycloak`. Roles are not
  part of a database dump; decide whether to add `pg_dumpall --globals-only`
  or to rely on `deploy/create-db-user.sh` recreating the read-only account.
- **A helper script in `deploy/`** (not in `run.sh`, which stays small) takes
  the environment as the other scripts do (`--stage`, `SECRETS=`), writes
  `<database>-<timestamp>.dump` files with mode 0600 into a backups
  directory under `deploy/data/<environment>/` (gitignored), and removes
  dumps older than a retention window (start with 7 days).
- **A systemd service and timer per environment** next to the existing units
  in `deploy/systemd/`: a oneshot service that requires the project's service
  (so it only runs while the stack is up) and a timer that runs it every night
  with `Persistent=true`. Installing the units and enabling the timer is a
  manual step on the host, like the units that start the project.
- **Long-term copies are outside the repository.** The backups directory is
  the interface: whatever copies files off the host picks the dumps up from
  there. The task says where the directory is and when the dump is ready, and
  nothing about the store behind it.

## Done

- Specified in [SPEC-deployment.md](../spec/SPEC-deployment.md): what is
  dumped, when, where, the retention window and the file modes.
- `deploy/backup-db.sh`, the service and timer per environment, installed by
  `deploy/deploy.sh` (the timer is not enabled by it). Decided: 03:00 every
  night, 7 days of retention, roles included as `pg_dumpall --globals-only`.
- The restore is written into the spec and was tried on scratch containers:
  into a new cluster and over an existing database, with data in the schema
  `avarc`, a role and a second database.

## Remaining

- Run it on stage: install with `deploy/deploy.sh stage`, enable the timer,
  check the first night's files and their modes, restore a real dump of
  stage into a scratch container and check the Flyway history and a row
  count.
- Do the same on prod once a release carries the script.
- Decide whether the long-term copy of the dumps, which holds personal data
  and credential hashes, needs to be encrypted, and whether a failed backup
  must alert someone (see [AVARC-21](TASK-observability-system.md)).

## Verification

A dump of `avarc` and `keycloak` appears every night on stage and prod, older
ones are removed after the retention window, the files are readable by the
service user only, and a dump restored into a scratch container starts the
application with its data and migrations intact.

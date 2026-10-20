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
  the feature templates `docker-compose.<feature>.template`, `run.sh` and the systemd units `systemd/avarc-stage.service`
  and `systemd/avarc-prod.service`, each running as its own user and group from that
  user's home directory (`/home/avarc-<environment>`). On the host,
  `deploy/deploy.sh stage|prod` (root only) installs them from a checkout:
  it copies the unit to `/etc/systemd/system` and `run.sh`, the account scripts and
  the templates together into the home directory, then reloads systemd. It never starts
  the service and never touches data or secrets. It records the version of
  the checkout (`git describe --tags`) in `VERSION` next to the files and
  prints it; for prod it refuses a checkout that is not exactly a release tag
  (see [SPEC-releases.md](SPEC-releases.md)) or has uncommitted changes. `run.sh` renders the templates with `envsubst` into `docker-compose.yml`
  (gitignored, mode 0600) at every start; `$$` is a literal dollar.
- **Feature templates:** `docker-compose.template` holds what always runs.
  An optional part of the deployment is a file of its own,
  `docker-compose.<feature>.template`, that only adds services, labels and
  other keys and overrides nothing of the core. `run.sh` renders every
  template with `envsubst`, merges the core and the features whose flag is on
  with `docker compose config` (which also validates the result), and writes
  the one `docker-compose.yml` that every command uses; a feature whose flag
  is off is not in it, so `up --remove-orphans` removes its containers. Today
  the features are `db-tailnet`, the labels that serve the database on the
  tailnet, and `dbtool`, the database tool; both are merged under the same
  flag (see "Database on the tailnet"). The merged file
  is generated for Compose, not for reading; the comments stay in the
  templates.
- **Environments:** `dev`, `stage` and `prod`. Every script of `deploy/` that
  works on an environment takes `--dev`, `--stage` or `--prod`, and finds the
  environment without one: the command line wins, then `SECRETS=dev|stage|prod`
  in the environment, then the user running the script (`avarc-stage`: stage;
  `avarc-prod` and `avarc`: prod; any other user: dev). The systemd units
  therefore need no option, though they may still pass one. The scripts that
  need a database that prod never exposes (`create-db-user.sh`, `import-sql.sh`,
  `import-legacy.sh`) refuse prod. The environment
  names the Compose project (`avarc-<environment>`), the data directory and
  the default ingress port (8080 dev, 8081 stage, 8082 prod; `INGRESS_PORT`
  overrides), so environments can run side by side.
- **Start and stop:** `deploy/run.sh [--stage] up` runs the project in
  the foreground, as systemd expects (`up -d` detaches), `down` stops it
  keeping data, any other argument is passed to `docker compose`. `reset`
  (dev only) stops the project and deletes its local data and generated
  secrets. Without arguments, or with `--help`, it prints the usage.
- **Operating without access to the deployment files:** the commands that act
  on the running containers (`down`, `stop`, `start`, `restart`, `ps`, `logs`,
  `top`, `kill`, `pause`, `unpause`, `exec`, `port`, `events`) neither read
  the secrets file nor render or write any file: `run.sh` passes them to
  `docker compose -p avarc-<environment>`, which finds the containers by their
  project label. A user who may use Docker but owns none of the deployment
  files can therefore stop, restart and inspect an environment; `down` then
  leaves the in-memory directories of the secrets for the owner's next start
  to replace. `restart` restarts the containers as they are and does not apply
  a changed template, secrets file or image; that takes a start of the unit,
  which is the job of the owner. The unit restarts a project that was stopped
  this way, so a lasting stop is `systemctl stop`.
- **One-shot services:** a service that only does a job at start (today
  `keycloak-init`, which creates Keycloak's database) leaves an exited
  container behind. `run.sh up` watches such a service in the background
  and removes its container once it has exited and the services that
  depend on it have been started after that (never earlier: compose would
  fail waiting for it), so `docker compose ps -a` shows only the
  running project. A further `up` creates it again.
- **Entry point:** the ingress is published on the environment's port on
  localhost. It carries docktail labels that expose it on the tailnet as
  `avarc-<environment>` on port 443, where docktail terminates TLS; the
  ingress itself does not.
- **Database on the tailnet (optional):** on dev and stage only, never on
  prod, the PostGIS database can be served on the tailnet as
  `avarc-<environment>-db`, port 5432, by docktail labels on the `db`
  service (TCP, no published host port). It is off unless the environment's
  secrets file sets `DB_TAILNET=true`; `run.sh` ignores the variable on prod,
  with a warning. Inspection uses the read-only account `avarc_ro` (created
  by `deploy/create-db-user.sh`, which takes its password
  `DB_READONLY_PASSWORD` from the secrets file or generates and appends one);
  it reads the tables of the `avarc` database, in the schemas `public` and `avarc`, and its sessions are read-only.
  The account cannot connect to Keycloak's database (users and credential
  hashes) unless `DB_KEYCLOAK=true` in the secrets file (or the option
  `--keycloak` of `create-db-user.sh`) asks for it and the script is run,
  which then grants read access; running the script without either withdraws
  it again.
  The same holds for the schema `legacy` of an imported legacy export (see
  below), which holds personal data: `avarc_ro` may read it only when
  `DB_LEGACY=true` in the secrets file (or the option `--legacy`) asks for it
  and the script is run once the schema exists; it is a schema of the `avarc`
  database, so the database tool shows it in its `avarc` connection and no
  connection of its own is added. Running the script without either
  withdraws the access again.
  The application's own credentials are not handed out. Who may reach the
  service is decided by the tailnet's access rules.
- **Importing a SQL file:** `deploy/import-sql.sh [--stage] [--schema NAME]
  FILE.sql`, on dev and stage only, loads a plain SQL file, such as the export
  of a legacy system, into the `avarc` database. The objects go into a schema
  of their own (default `legacy`, never `public` or `avarc`) unless the file
  names a schema itself, and the load is one transaction, so a failing file
  leaves nothing behind. It is run on the host of the environment and uses the
  database's own account inside the `db` container, like `create-db-user.sh`;
  it reads no password. Mapping the imported tables onto the application's
  tables is a separate step.
- **Backups:** introduced with
  [AVARC-48](../tasks/finished/TASK-database-backup.md). `deploy/backup-db.sh
  [--stage]` takes a logical backup of the databases of an environment: a
  `pg_dump -Fc` of `avarc` (the schemas `avarc` and, when imported, `legacy`)
  and of `keycloak` when it exists, and `pg_dumpall --globals-only` for the
  roles. It runs inside the `db` container as the database's own account, like
  `create-db-user.sh`, so the dump matches the running PostgreSQL version and
  no password is read. The files `<database>-<yyyymmdd-hhmmss>.dump` and
  `globals-<yyyymmdd-hhmmss>.sql` go to `data/<environment>/backups/` next to
  the script (gitignored), mode 0600, because they hold personal data and
  credential hashes; a file appears under its final name only when complete.
  Files older than `BACKUP_KEEP_DAYS` (default 7) are removed. On stage and
  prod, `systemd/avarc-<environment>-backup.service` (oneshot, after the
  project's service, run by the same user) and `.timer` (every night at 03:00,
  `Persistent=true`) run it; `deploy.sh` installs both but does not enable the
  timer: `systemctl enable --now avarc-<environment>-backup.timer` is a step on
  the host. The service does not start the project: with the `db` service down
  the run fails with a message in the journal. The run also exports the users
  of the realm into the same directory when Keycloak is running
  (`keycloak-users-<yyyymmdd-hhmmss>.json`, see
  [SPEC-auth.md](SPEC-auth.md), "Surviving a rebuild of Keycloak's data").
  Copying the dumps off the host
  is outside this repository; the backups directory is the interface.
  - **Restore:** `deploy/restore-db.sh [--stage] [--scratch] [--globals]
    [--database NAME]... [--no-backup] [--yes] [STAMP]` restores the files of
    one backup run
    (`STAMP` like `20261018-030010`, default the newest) from the backups
    directory (`BACKUP_DIR` overrides it). The steps are the manual ones, in
    this order, all inside the `db` container as the database's own account:
    the roles (`globals-<stamp>.sql`, only with `--globals`, for a new
    cluster; errors for roles that exist are harmless), then each database
    with `pg_restore --clean --if-exists --create`, which drops and recreates
    it from the dump. Without `--database` that is every database that has a
    dump in the run; `--database avarc` or `--database keycloak` (repeatable)
    restores only those, and leaves the other database as it is.
    - **Into the environment** (the default) replaces the data, so the script
      refuses to run while `backend`, `keycloak` or `dbtool` are up (stop them
      with `run.sh [--stage] stop backend keycloak`, and `dbtool`), takes a
      fresh backup first unless `--no-backup` says the database is beyond
      that, and asks to type the environment's name unless `--yes` is given.
      Start the services again afterwards.
    - **`--scratch`** is the way to try a dump: it restores into a throwaway
      container of the same image as the `db` service, without volume or
      published port, restores the roles too (a new cluster has none),
      compares it with the running database when there is
      one, and removes the container; the environment is not touched and
      nothing needs to be stopped.
    - Either way it ends with a check of the migration history
      (`avarc.flyway_schema_history`: latest version and number of entries),
      the number of locations and users of the application and of Keycloak's
      accounts and realms; a scratch run shows the live value next to each
      one, where small differences are expected because the backup is older.
    - Verified with a dump of a database holding data in the schema `avarc`,
      a role and a second database: the restore into a new cluster, and over
      an existing database, both succeed and the data and the roles are back.
      A dump taken by the stage timer (2026-10-18) was restored into a
      scratch container: the migration history, the locations with their
      positions, the users and Keycloak's realms and accounts equal those of
      the running database, and both roles are back.
- **Database tool (optional):** introduced with
  [AVARC-38](../tasks/TASK-database-tailnet.md). With `DB_TAILNET=true`, the
  `dbtool` service is started as well: CloudBeaver (Community edition, image
  `dbeaver/cloudbeaver`, pinned to an exact version in the template), a web
  tool to browse tables, run read-only queries and show spatial columns on a
  map. It is served on the tailnet by docktail labels as
  `avarc-<environment>-dbadmin` (HTTPS on 443, docktail terminates TLS), has
  no published host port and is not routed by the ingress. Without the
  variable, and on prod always, the service is not started (it is in the
  feature template `dbtool`, which `run.sh` merges only then). It is written for "the database",
  not for one engine: a connection is listed per database of the
  environment, so an engine change or an internal SQLite database adds or
  replaces a connection, not the tool. A SQLite file would be read from a
  read-only mount and has no port of its own (but see Verified below).
  - **No setup by hand:** `run.sh` configures the tool at each start from
    files it renders into the in-memory secrets directory and mounts
    read-only, so the first-run wizard never appears. The server
    configuration is a Java properties file mounted as
    `conf/.cloudbeaver.auto.conf` (keys `CB_SERVER_NAME`, `CB_SERVER_URL`,
    `CB_ADMIN_NAME`, `CB_ADMIN_PASSWORD`); the admin name and password are
    `DBTOOL_ADMIN_NAME` (default `dbadmin`; `admin` and `user` are the names
    of the tool's built-in teams and are refused) and `DBTOOL_ADMIN_PASSWORD`
    of the secrets file, the password generated and appended when missing and
    meeting the tool's policy (at least eight characters, mixed case, a
    digit). The
    connections are `GlobalConfiguration/.dbeaver/data-sources.json`, with
    `read-only` set, the user and password of the read-only account in
    `auth-properties`, and no custom connections for users. The password is
    therefore in a file that exists only in the memory directory, never in
    the repository or on disk between starts. The configuration is
    regenerated at every start and wins over changes made in the tool.
    The tool creates the admin account only when its workspace is first
    started, so `run.sh` keeps a fingerprint (a hash) of the admin name and
    password in the workspace; when the secrets file no longer matches it,
    `run.sh` stops the tool and removes the tool's own database, and the
    account is created again from the current values at that start. A
    workspace without a fingerprint, from before this rule, is reset once.
  - **Access:** the tool's own login (the admin account above) is required;
    anonymous access is switched off. The connections use the read-only
    account of `create-db-user.sh`, never the application's role, so the
    database stays read-only whatever is typed in the tool. Keycloak's
    database is a second connection, `keycloak`, with the same account, only
    when `DB_KEYCLOAK=true` (the access itself is granted by
    `create-db-user.sh`, see above); otherwise it is not a connection. The map view loads its base map from a
    public tile server in the browser of the person using it.
  - **State:** the tool's workspace is under `deploy/data/<environment>/`,
    which `reset` removes. The container runs as the user that started the
    project, like `keycloak`, to read the secrets directory.
  - **Verified (CloudBeaver 26.2.2):** started by `run.sh` on the
    developer deployment, the tool comes up configured without the wizard,
    the admin account logs in, anonymous access is off, the one connection is
    read-only and connects to PostGIS with the read-only account (after
    `create-db-user.sh`), with the container running as the starting user and
    the configuration files mounted read-only. A second `up` over running
    containers, a start with the tool disabled (the container and its
    in-memory configuration are removed) and `down` all work. On stage, the
    Value panel of a geometry cell has a MAP tab that shows the point on a
    base map, and the `keycloak` connection works once `create-db-user.sh`
    has granted it. Not covered: SQLite. The SQLite driver is disabled in
    this web build ("Driver disabled" on connecting, also with
    `enabledDrivers` set in the server configuration), so the tool does not
    cover a SQLite database until that is solved.
- **Data:** bind-mounted under `deploy/data/<environment>/` (gitignored).
- **Secrets:** their values are in `deploy/secrets.dev.sh` (dev; generated
  with random values on the first start), `deploy/secrets.stage.sh` or
  `deploy/secrets.sh` (prod), all gitignored and exporting one variable per
  secret. `run.sh` reads each needed secret from that file in an isolated
  shell, writes one file per secret into a directory in memory
  (`secrets` below the run directory, mode 0700), and mounts it
  read-only at `/run/secrets` in the containers that need it. The run
  directory is `/run/avarc-<environment>`, which the systemd unit creates
  for its user (`RuntimeDirectory=`, mode 0700) and systemd removes when the
  unit stops, so the secrets do not outlive the service; without that
  directory (dev, no unit) it is `avarc-<environment>` in the user's runtime
  directory (`$XDG_RUNTIME_DIR`). The configuration of the database tool is
  rendered into `dbtool` below it. Secrets are
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
- **Footer links:** on dev and stage `run.sh` passes the frontend
  `FOOTER_API_DOCS=true` and, if the database tool is enabled,
  `FOOTER_DBTOOL_URL` set to its address, and `FOOTER_KEYCLOAK_URL` set to the
  address of the realm's admin console; on prod all are empty
  ([SPEC-frontend.md](SPEC-frontend.md), AVARC-45).
- **Host settings:** `IMAGE_NAMESPACE` and the `*_VERSION` variables (the
  images to run) are taken from the environment if set there, otherwise
  from the environment's secrets file (an exported variable of that name,
  read in the same isolated shell), otherwise from the defaults of
  `run.sh`. This lets a host name its own registry or mirror in a file that
  is never committed, with no change to the systemd unit or this
  repository.
- **Upstream registry:** the upstream images (the database, `keycloak-init`
  and the database tool) are named `${UPSTREAM_REGISTRY}/<image>`; the host
  setting `UPSTREAM_REGISTRY` defaults to `docker.io` and names a registry
  cache instead, set like `IMAGE_NAMESPACE`. It may include a path, as a cache
  that serves several upstream registries keeps Docker Hub under a prefix of
  its own. It is independent of `IMAGE_NAMESPACE`, which names the project's
  images, a different upstream.
- **Image pull:** `run.sh up` first pulls the images when `IMAGE_NAMESPACE`
  names a registry (it contains a `/`, like `ghcr.io/avarcorg`); with the
  default namespace the images are the ones built on the host and nothing is
  pulled. A failed pull is tried again a few times with a pause in between
  (4 attempts, 15 seconds; `PULL_ATTEMPTS` and `PULL_RETRY_DELAY` change
  that). When the last attempt fails, `run.sh` stops with a message before
  anything is started, and the service manager's own restart tries again later.
- **No image monitoring:** the services that run the project's own images
  (`avarc-ingress`, `avarc-backend`, `avarc-frontend`, `avarc-keycloak`) carry
  the label `dd.watch=false`, so that Drydock neither monitors nor scans their
  containers; Drydock has no narrower switch. The services that run upstream
  images (the database, the database tool and the one-shot `keycloak-init`)
  stay watched. A new service gets the label if it runs one of our images. It
  takes effect when `deploy/run.sh up` recreates the containers.
- **Updating stage:** stage runs the moving tag `snapshot` of the four images
  (the latest build of `main`). An update is a restart of the service: the
  stack stops, `run.sh up` pulls the new images and starts them, and the
  checks are the frontend's `/health` (200), `/api/hello` (401 without a login),
  `/auth/realms/avarc/.well-known/openid-configuration` (200; the bare realm
  path answers 404 at the ingress) and the origin (307). A rollback sets the four
  `*_VERSION` variables of the host to `sha-<commit>` of the earlier build
  and restarts; going back to `snapshot` removes them again. A successful
  build of `main` prompts the update (see [SPEC-releases.md](SPEC-releases.md)).
  Prod is not updated this way: it runs release tags only.
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
- **Keycloak's database:** decided in
  [AVARC-54](../tasks/TASK-social-login.md): Keycloak keeps its database
  (`keycloak`, created by `keycloak-init`) in the same database server as the
  application's, with no server of its own. For: no further container and
  memory on a small host, one place to back up and one major version to
  upgrade, and everything around it already works with it (dumps, restore,
  the user export of [SPEC-auth.md](SPEC-auth.md), the rule of the read-only
  account). Against: a failure or upgrade of the server hits both, and both
  connect as the same role. The users do not depend on the dump alone: the
  user export is a second protection. The decision can be reversed: moving
  the database to a server of its own is a dump, a restore and a changed
  connection address. Next steps, if needed: a role of its own for Keycloak
  with its own password (separates the credentials at little cost), and
  after that a server of its own (independent failure, upgrade and restore,
  at the price of one more container and a second backup path).

- **Observability of the project** ([AVARC-24](../tasks/TASK-observability-ingress-database.md),
  [SPEC-observability.md](SPEC-observability.md)):
  - Every service logs through Docker's `json-file` driver with rotation
    (10 MB, 5 files), which the log collector of the monitoring stack reads.
  - Every service has a container health check. The backend, the frontend
    and the ingress run the Tiny Health Checker of the Paketo health-checker
    buildpack (`/layers/paketo-buildpacks_health-checker/thc/bin/thc`, set by
    `THC_PORT` and `THC_PATH`), because the backend image has no shell: the
    backend asks `/actuator/health/readiness` on its management port (9091), the
    frontend `/health` and the ingress
    its metrics listener. Keycloak and the database use their readiness. The
    modules name the buildpack in `image.buildpack` of their POM and the
    parent POM adds the health checker to every `pack` build. The frontend
    listens on all addresses (`HOSTNAME`) so that the check reaches it on
    localhost.
  - The ingress routes `/actuator/` to the backend only where `run.sh` sets
    `FOOTER_API_DOCS=true` (dev and stage; passed on as `ACTUATOR_ENABLED`).
  - The network `<project>-metrics` carries only metrics endpoints: the
    ingress, the frontend, the backend (management port 9091), Keycloak
    (management port 9000) and the database are attached to it, and the monitoring stack
    joins it as an external network. Nothing on it is published. The
    network may exist before the project is started (the monitoring stack
    creates it if missing): `up` uses it as it is, and `down` leaves it in
    place while another container is attached.
  - The database logs statements slower than 500 ms.

## Open questions

- Deployment target and environments beyond the developer deployment.

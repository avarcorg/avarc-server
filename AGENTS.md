# AGENTS.md

avarc-server: an application to collect data of historical interest, with
locations and descriptions.

## Specs

- `SPEC.md` is the main global spec. It links to per-area specs.
- Per-area specs live in `spec/` and are named `SPEC-<area>.md`.
- Specs are committed to git.

## Tasks

- Tasks live in `tasks/`, one file per task, named `TASK-<slug>.md`.
- Tasks are committed to git, including finished ones, which stay in
  history until a better place is found. This overrides any general rule
  against committing task files, and applies to this repository only.
- Work items carry front matter (`id`, `type`, `status`, ...) and are
  tracked in `tasks/INDEX.md`, as defined in `spec/SPEC-work-tracking.md`.
  Refer to items by ID (`AVARC-<n>`) in commit messages. After editing
  items, run `tools/tasks.py index`; install the pre-commit check once per
  clone with `tools/install-hooks.sh`.
- Finished tasks are moved to `tasks/finished/` (use `git mv`). Every
  reference to a moved task file, in specs, other tasks and docs, is updated
  to the new path in the same change.
- Root-level `TASK.md` / `TASK-*.md` are gitignored local scratch files and
  are not the same thing as `tasks/`.

## Backend

Java 25, Spring Boot, Maven (spec: `spec/SPEC-backend.md`). The root
`pom.xml` is the parent and builds the `avarc-server-backend` module; always
use the wrapper `./mvnw` from the root. The wrapper downloads Maven from
Maven Central.

    ./mvnw verify                                  # build and test
    ./mvnw -pl avarc-server-backend spring-boot:run   # run on port 8080
    ./mvnw -Pwith-docker package                   # also build the container images

The backend image is built with Paketo buildpacks by the `pack` CLI (which needs a
running Docker daemon), run from the `with-docker` profile. It is tagged
`avarcorg/avarc-backend:<version>` and `:latest`, and listens on port
8080. Override the `avarcorg` namespace with `-Dimage.namespace=<name>`, e.g.
`-Dimage.namespace="$IMAGE_NAMESPACE"`.

The backend code is split into application modules, direct sub-packages of
`org.avarc.server` (rule in `spec/SPEC-backend.md`); `ModularityTests`, part
of `./mvnw verify`, fails on a broken boundary and writes the module
diagrams to `avarc-server-backend/target/spring-modulith-docs/`.

The service answers `GET /actuator/health`; everything else, such as
`GET /api/hello`, needs a login (see Authentication). Only in the
dev and stage environments are all actuator endpoints exposed: the Spring
profile named after the environment is activated with
`SPRING_PROFILES_ACTIVE` (`application-dev.properties`,
`application-stage.properties`; `spring-boot:run` uses `dev` by default).
Prod has no profile file and exposes `health` only. The same two
environments serve the OpenAPI document at `/api/docs/openapi.json` and
Swagger UI at `/api/docs`, readable without a login (spec:
`spec/SPEC-backend.md`); prod serves neither. The Compose project runs
the backend, frontend, ingress and Keycloak images (`IMAGE_NAMESPACE`, `BACKEND_VERSION`,
`FRONTEND_VERSION`, `INGRESS_VERSION`, `KEYCLOAK_VERSION`, see `spec/SPEC-deployment.md`), so build them with `-Pwith-docker` before
`deploy/run.sh up`.

## Frontend

Next.js with TypeScript, a module of the same Maven build (spec:
`spec/SPEC-frontend.md`). Node and npm are not installed anywhere; all of it
runs in a container, driven by the wrapper:

    ./mvnw -pl avarc-server-frontend verify           # npm ci and next build
    ./mvnw -pl avarc-server-frontend exec:exec        # dev server, port 3000

`-Pwith-docker` builds the frontend image as well, with Paketo like the
backend. Check every new or moved dependency with the image build
(`./mvnw -Pwith-docker -pl avarc-server-frontend package`) before pushing:
`verify` alone does not run `pack`, which rejects a dependency that is
missing from the traced `node_modules` (one that Next bundles belongs in
`devDependencies`, see `spec/SPEC-frontend.md`).

For other npm commands (adding a dependency, updating the lockfile) use
`NODE_IMAGE=<node.image> avarc-server-frontend/docker-node.sh npm ...`; the
image is the `node.image` property of `avarc-server-frontend/pom.xml`. Image
naming (`image.namespace`) is the same as for the backend; the frontend is
the `frontend` service of the Compose project (`FRONTEND_VERSION`).

## Ingress

The `ingress` service is nginx, run from the image of the module
`avarc-server-ingress` (spec: `spec/SPEC-ingress.md`), built with Paketo
from its `nginx.conf` by `-Pwith-docker` and tagged `avarc-ingress`. The
routing is in that file; a change of it needs a new image. The container
listens on port 8080.

## Authentication

Keycloak runs as the `keycloak` service of the Compose project (spec:
`spec/SPEC-auth.md`), run from the image of the module `avarc-server-keycloak`
(a Dockerfile built by `-Pwith-docker`, tagged `avarc-keycloak`), which holds the realm
import and the start script. Create
the accounts of an environment, the initial admin included, after the project
is up; it is safe to repeat (needs `curl` and `jq`):

    deploy/create-admin-user.sh [--stage]      # SECRETS=prod for prod

Further users are created with `deploy/create-user.sh [--stage] [--admin]
EMAIL...` (same `SECRETS`): editors, or admins with `--admin`. It prints a
random one-time password per new user, to be changed at the first login;
with `--permanent` it reads a password per user instead (hidden prompt, or
one line per user on stdin), which stays valid.

The credentials come from the environment's secrets file (`ADMIN_EMAIL`,
`ADMIN_PASSWORD`, optionally `EDITOR_*` and `VIEWER_*`); the dev file gets
`admin@avarc.invalid` with a random password when it is generated. Admins
manage users, roles and passwords in the console of the `avarc` realm at
`https://avarc-<environment>-kc.<tailnet domain>/auth/admin/avarc/console/`
on the tailnet
(served by docktail, see `spec/SPEC-deployment.md`), signing in with their
own account. The ingress does not route the console. A change of `avarc-server-keycloak/avarc-realm.json` does
not reach an existing realm (Keycloak imports only when the realm is absent);
apply it in the console, or on dev with `deploy/run.sh reset`.

Users log in and out through the backend, which is the OIDC client of
Keycloak and keeps the session in a cookie: the frontend pages `/login` and
`/logged-out` link to `/api/auth/login/keycloak` and post to
`/api/auth/logout`, and `GET /api/auth/me` reports the logged-in user. On
the developer deployment the origin is the one `run.sh` prints in
`PUBLIC_ORIGIN`, not necessarily `localhost`; a login only works through it.

## Database access

On dev and stage the database can be served on the tailnet (spec:
`spec/SPEC-deployment.md`): set `export DB_TAILNET=true` in the environment's
secrets file, restart with `deploy/run.sh up`, and create the read-only
account with `deploy/create-db-user.sh [--stage]`. Its password,
`DB_READONLY_PASSWORD`, is taken from the secrets file or generated into it.
Keycloak's database (users, credential hashes) is closed to the account;
`--keycloak` opens it for reading, running the script without the option
closes it again. Connect as `avarc_ro` to `avarc-<environment>-db` on port 5432, database
`avarc`. Prod never exposes the database.

With `DB_TAILNET=true` the web database tool (CloudBeaver) is started as well,
at `https://avarc-<environment>-dbadmin.<tailnet domain>`. Nothing is set up by
hand: sign in as `DBTOOL_ADMIN_NAME` (default `dbadmin`) with
`DBTOOL_ADMIN_PASSWORD`, which `run.sh` generates into the secrets file when
it is missing; a changed name or password takes effect at the next start
(the tool's accounts are reset). The one connection, `avarc`, is read-only and uses the
`avarc_ro` account, so run `deploy/create-db-user.sh [--stage]` first. The
configuration is rendered at every start, so changes made in the tool do not
survive a restart.

## Releases

A release is a `vMAJOR.MINOR.PATCH` tag on `main` (spec:
`spec/SPEC-releases.md`). Create it with `tools/release.sh <version>`; add
`--push` to push the tag too. To run a release on a host, check out its
tag and run `deploy/deploy.sh` from there; prod accepts nothing else.

The workflow "CI Build" (`.github/workflows/ci-build.yml`) builds and tests every push to
`main`, every release tag and every pull request. Pushes to `main` publish
the images `ghcr.io/avarcorg/avarc-backend`, `-frontend`, `-ingress` and `-keycloak` as
`snapshot` and `sha-<commit>`, release tags as `X.Y.Z` and `latest`
(`tools/publish-images.sh`, `--dry-run` shows what it would push). To run
published images, start the Compose project with
`IMAGE_NAMESPACE=ghcr.io/avarcorg` and `BACKEND_VERSION`,
`FRONTEND_VERSION`, `INGRESS_VERSION` and `KEYCLOAK_VERSION` set to a tag. The packages are public; no login is needed to pull. A host can
keep these variables in its secrets file instead of the environment. With a
registry namespace, `run.sh up` pulls the images first and retries a failed pull a
few times.

## Shell scripts

`tools/shellcheck.sh` lints all shell scripts with ShellCheck (warnings and
errors; it uses the installed `shellcheck` or its container image). The
`ShellCheck` workflow runs it when a script changes; keep it clean.

## Where things do NOT go

Ad-hoc help requests (e.g. "help me ...") and decisions about how to work
with the agent belong in the agent's project memory, not in `tasks/` or
`spec/`.

## Secrets

- Never commit secrets. `.gitignore` excludes `secrets*.sh`, `*-key.json`,
  `.env*`, `*.pem` and `*.key`.
- The `secrets-guard` Claude Code plugin is enabled via
  `.claude/settings.json`; it blocks staging and reading such files. Extra
  patterns can be added in `.claude/secrets-guard.patterns`.
- Scripts that source a secrets file must guard that line against inherited
  `xtrace` (save the `-x` state, `set +x`, source, restore).

## Commits

Split specification, code and documentation changes into separate commits,
never mixed. Specification means `SPEC.md` and `spec/`; code means
functional source and config files (including `.gitignore` and
`.claude/settings.json`); documentation means files that describe or
instruct (`AGENTS.md`, `CLAUDE.md`, `README.md`). When one piece of work
touches more than one, commit in that order: specification, code,
documentation.

## AI usage

Contribution rules for AI-assisted work are in `AI_POLICY.md`. Agents
working in this repo follow them, including keeping any AI attribution out
of commit messages.

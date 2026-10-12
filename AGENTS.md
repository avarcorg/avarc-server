# AGENTS.md

avarc-server: an application to collect data of historical interest, with
locations and descriptions.

## Specs

- `SPEC.md` is the main global spec. It links to per-area specs.
- Per-area specs live in `spec/` and are named `SPEC-<area>.md`.
- Specs are committed to git.

## Tasks

- Tasks live in `tasks/`, one file per task, named `TASK-<slug>.md`.
- Tasks are committed to git.
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
    ./mvnw -Pwith-docker package                   # also build the container image

The image is built with Paketo buildpacks by the `pack` CLI (which needs a
running Docker daemon), run from the `with-docker` profile. It is tagged
`avarcorg/avarc-server-backend:<version>` and `:latest`, and listens on port
8080. Override the `avarcorg` namespace with `-Dimage.namespace=<name>`, e.g.
`-Dimage.namespace="$IMAGE_NAMESPACE"`.

The service answers `GET /api/hello` and `GET /actuator/health`. Only in the
dev environment are all actuator endpoints exposed: the Spring profile named
after the environment is activated with `SPRING_PROFILES_ACTIVE` (the
`dev` profile is `application-dev.properties`; `spring-boot:run` uses it by
default). Stage and prod have no profile file and expose `health` only.

## Authentication

Keycloak runs as the `keycloak` service of the Compose project (spec:
`spec/SPEC-auth.md`); the realm is imported from `deploy/keycloak/`. Create
the accounts of an environment, the initial admin included, after the project
is up; it is safe to repeat (needs `curl` and `jq`):

    deploy/accounts.sh [--stage]      # SECRETS=prod for prod

The credentials come from the environment's secrets file (`ADMIN_EMAIL`,
`ADMIN_PASSWORD`, optionally `EDITOR_*` and `VIEWER_*`); the dev file gets
`admin@avarc.invalid` with a random password when it is generated. Admins
manage users, roles and passwords in the console of the `avarc` realm at
`https://avarc-<environment>-kc.<tailnet domain>/auth/admin/avarc/console/`
on the tailnet
(served by docktail, see `spec/SPEC-deployment.md`), signing in with their
own account. The ingress does not route the console. A change of `deploy/keycloak/avarc-realm.json` does
not reach an existing realm (Keycloak imports only when the realm is absent);
apply it in the console, or on dev with `deploy/run.sh reset`.

## Releases

A release is a `vMAJOR.MINOR.PATCH` tag on `main` (spec:
`spec/SPEC-releases.md`). Create it with `tools/release.sh <version>`; add
`--push` to push the tag too. To run a release on a host, check out its
tag and run `deploy/deploy.sh` from there; prod accepts nothing else.

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

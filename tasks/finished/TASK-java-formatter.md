---
id: AVARC-44
type: task
status: finished
priority: normal
area: backend
created: 2026-10-15
---

# TASK: Java formatter

Spec: [SPEC-backend.md](../../spec/SPEC-backend.md)

The backend code has no enforced format. Introduce Open Java Format
(<https://openjavaformat.dev/>), a deterministic formatter with one style
and no options, so formatting is never a topic in a diff or a review. It
applies to the build and to every piece of Java that an agent writes.

## Specification phase

Before code, `SPEC-backend.md` records the decisions: the formatter and its
pinned version, that the style is fixed (no configuration), that the build
formats and checks the code, and the rule for agents below. The facts the
site gives (Maven plugin `dev.openjavaformat:fmt-maven-plugin` together with
the `dev.openjavaformat:open-java-format` dependency that selects the
formatter version, a `format` goal at `process-sources`, a check for CI,
command line `--replace` and `--dry-run --set-exit-if-changed`, Maven on
Java 21 or later) are verified against the real tool first; the license and
support for Java 25, which the project uses, are not stated on the site and
are checked and written down.

## Suggested implementation

- **Build:** the plugin is declared in the root `pom.xml`
  (`pluginManagement`, versions as properties so Renovate updates them, see
  [SPEC-dependency-updates.md](../../spec/SPEC-dependency-updates.md)) and
  runs in the backend module.
  - A normal local build formats the sources (`format`); the CI build and
    `./mvnw verify` with a CI flag fail on unformatted code (check) instead
    of rewriting it. Which of the two is the default locally is decided in
    the specification phase.
  - It covers `src/main/java` and `src/test/java`.
  - It works with the wrapper in the way of the other tools, with no
    Java or tool installed by hand besides what the build downloads.
- **One-time reformat:** the existing code is formatted in a commit of its
  own, containing nothing else, so `git blame` can skip it (add the commit
  to `.git-blame-ignore-revs`).
- **Pre-commit:** the check is added to the hook that
  `tools/install-hooks.sh` installs, next to the work-item check
  ([SPEC-work-tracking.md](../../spec/SPEC-work-tracking.md)), so unformatted
  Java does not get committed. The hook runs it on staged Java files only
  and stays fast.
- **CI:** the "CI Build" workflow fails on unformatted code; it needs no
  step of its own if the build checks.
- **Agents:** `AGENTS.md` gets a rule that an agent formats every Java
  file it writes or changes with the formatter before it shows a diff to
  the user and before it commits, and checks that the result is clean. The
  command to use is stated there once. Agents that can run hooks
  of their own (the "agent hooks" the formatter offers) are considered
  for enforcing it, but the rule in `AGENTS.md` is the baseline.
- **Commits:** the pom and tooling change is code, the rule in `AGENTS.md`
  is documentation, and the spec comes first, as for any task
  (`AGENTS.md`, section Commits).

## Acceptance

- `./mvnw verify` fails on a badly formatted Java file in CI mode and
  formats it in the default local mode, as the spec decides.
- The existing code is formatted; the reformat commit is listed in
  `.git-blame-ignore-revs`.
- The pre-commit hook rejects staged unformatted Java.
- `AGENTS.md` states the rule for agents and the command.
- The specs record the choice, the version, the license and the Java 25
  finding before or together with the code.
- Updates of the formatter version arrive through Renovate.

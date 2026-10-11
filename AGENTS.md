# AGENTS.md

avarc-server: an application to collect data of historical interest, with
locations and descriptions. No source code exists yet.

## Specs

- `SPEC.md` is the main global spec. It links to per-area specs.
- Per-area specs live in `spec/` and are named `SPEC-<area>.md`.
- Specs are committed to git.

## Tasks

- Tasks live in `tasks/`, one file per task, named `TASK-<slug>.md`.
- Tasks are committed to git.
- Work items carry front matter (`id`, `type`, `status`, ...) and are
  tracked in `tasks/INDEX.md`, as defined in `spec/SPEC-work-tracking.md`.
  Refer to items by ID (`AVARC-<n>`) in commit messages.
- Finished tasks are moved to `tasks/finished/` (use `git mv`). Every
  reference to a moved task file, in specs, other tasks and docs, is updated
  to the new path in the same change.
- Root-level `TASK.md` / `TASK-*.md` are gitignored local scratch files and
  are not the same thing as `tasks/`.

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

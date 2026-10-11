# SPEC: Work tracking

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Track open work items (tasks, bugs, decisions, spikes) inside the repository,
without external software and without GitHub issues.

## Requirements

- Every work item is one file `TASK-<slug>.md` in `tasks/`; finished items
  live in `tasks/finished/`.
- Every item file starts with YAML front matter with these fields:
  - `id`: `AVARC-<n>`, unique and never reused, stable even if the slug
    changes.
  - `type`: `task`, `bug`, `decision` or `spike`.
  - `status`: `open`, `in-progress`, `blocked` or `finished`.
  - `priority`: `high`, `normal` or `low`.
  - `area`: the spec area concerned, for example `backend`, `frontend`,
    `auth`, `ingress`, `project`.
  - `depends-on`: list of IDs, optional.
  - `owner`: optional.
  - `created`: ISO date.
- `status` is the source of truth. An item is in `tasks/finished/` exactly
  when its status is `finished`.
- IDs are allocated by increasing number. [AVARC-1](../tasks/finished/TASK-architecture-diagram.md)
  and AVARC-2 (this tracking) are fixed; the remaining existing items are
  numbered when they get their front matter.
- `tasks/INDEX.md` lists all items (ID, title, type, status, priority, area,
  dependencies) and is generated from the front matter, never edited by
  hand. It is committed.
- A status change is a commit editing the front matter, and moving the file
  when it becomes finished. References to a moved file are fixed in the same
  change.
- Commit messages and specs refer to items by ID.
- A check fails on: duplicate or missing IDs, invalid field values, a
  `depends-on` entry that does not resolve, a file in the wrong directory
  for its status, or an `INDEX.md` that is out of date. It runs locally
  (for example as a pre-commit hook) and in CI.
- Tooling has no dependencies beyond a standard shell or Python.

## Open questions

- Where the index/check script lives and in which language.
- Whether the check runs as a pre-commit hook, in CI, or both.
- Handling of ID collisions when several people add items in parallel.

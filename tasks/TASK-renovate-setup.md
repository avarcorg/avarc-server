---
id: AVARC-15
type: task
status: open
priority: normal
area: dependency-updates
depends-on: [AVARC-4, AVARC-7]
created: 2026-10-11
---

# TASK: Set up Renovate

Spec: [SPEC-dependency-updates.md](../spec/SPEC-dependency-updates.md)

- Decide the Renovate deployment (hosted app or self-hosted) and enable it
  for this repository.
- `renovate.json` in the repository root exists: Renovate itself added it
  (commit `3b7b8a9`) with only `config:recommended`. It is a baseline, not
  the final configuration.
- Adapt `renovate.json` once the backend and frontend architecture is
  agreed ([AVARC-4](TASK-backend-stack-decision.md),
  [AVARC-7](TASK-frontend-stack-decision.md)): enable the package managers
  of the chosen stacks, group related updates, and set scheduling, rate
  limits and the major/security update policy (the open questions in the
  spec). Keep the Compose template and the GitHub workflows covered.
- Restrict Renovate to the default branch (`main`) as its only base branch.
- Tell Renovate to ignore the pre-existing branches listed in the spec
  (historic development branches, `dependabot/**`, `renovate/**`); verify
  with a dry run that it opens no pull requests against or from them.
- Disable Dependabot version updates in the repository settings and remove
  any `.github/dependabot.yml`.
- Decide whether the stale `dependabot/**` and `renovate/**` branches on the
  remote are deleted; deleting them needs the user's explicit approval.
- Update `spec/SPEC-dependency-updates.md` with the decisions.

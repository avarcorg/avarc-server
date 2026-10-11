# TASK: Set up Renovate

Spec: [SPEC-dependency-updates.md](../spec/SPEC-dependency-updates.md)

- Decide the Renovate deployment (hosted app or self-hosted) and enable it
  for this repository.
- Add `renovate.json` in the repository root with a baseline configuration.
- Restrict Renovate to the default branch (`main`) as its only base branch.
- Tell Renovate to ignore the pre-existing branches listed in the spec
  (historic development branches, `dependabot/**`, `renovate/**`); verify
  with a dry run that it opens no pull requests against or from them.
- Disable Dependabot version updates in the repository settings and remove
  any `.github/dependabot.yml`.
- Decide whether the stale `dependabot/**` and `renovate/**` branches on the
  remote are deleted; deleting them needs the user's explicit approval.
- Update `spec/SPEC-dependency-updates.md` with the decisions.

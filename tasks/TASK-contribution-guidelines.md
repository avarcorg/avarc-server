---
id: AVARC-5
type: task
status: open
priority: normal
area: project
created: 2026-10-11
---

# TASK: Contribution guidelines and AI disclosure

Spec: [SPEC.md](../SPEC.md)

Make `AI_POLICY.md` visible and usable for contributors and agents.

- Add `CONTRIBUTING.md` linking to `AI_POLICY.md`, covering the sign-off
  (`git commit -s`) requirement and the spec/code/documentation commit split
  from `AGENTS.md`.
- Add a pull request template with an AI-disclosure field (tool used and
  extent of assistance), a linked-issue field and a test-evidence field.
- Add an issue template reminding authors to review and trim AI-generated
  text.
- Link `AI_POLICY.md` and `CONTRIBUTING.md` from `README.md`.
- Add a `SECURITY.md` stating how to report vulnerabilities.
- Consider GitHub-enforced rules (branch protection, required reviews,
  required signed commits, `CODEOWNERS`) once a signing key exists, and
  record the outcome in `AGENTS.md`.

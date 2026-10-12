---
id: AVARC-28
type: task
status: open
priority: low
area: project
created: 2026-10-12
---

# TASK: Simplify the architecture documentation for handover

Spec: [SPEC.md](../SPEC.md)

To be attempted after the MVP. The codebase may be handed to a person who is
not a developer, so the documentation should describe only the architecture
needed to understand, run and look after the application.

- Review `SPEC.md`, the architecture diagram, `README.md` and `AGENTS.md`
  from the point of view of that reader.
- Describe what runs where and how to start, stop, back up and update the
  application, in plain language.
- Keep the architecture as it is; do not add concepts (such as event
  sourcing) for their own sake.
- Trim speculative parts, such as the post-MVP MCP and public map servers,
  or move them into one clearly marked section about later work.
- Update the specs and the diagram to match.

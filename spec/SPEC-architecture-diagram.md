# SPEC: Architecture diagram

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Provide a diagram of the system architecture that stays in step with the
specs.

## Requirements

- The diagram shows the browser, the web server in front of the partial
  applications, the frontend, the backend, Ory and the database, and the
  connections between them.
- Components and decisions that are not yet made are marked as undecided in
  the diagram.
- The diagram is stored in the repository as text, so changes are reviewable
  in git. A rendered form may be generated from it.
- It is referenced from the architecture overview in [SPEC.md](../SPEC.md).
- Whenever a spec changes the architecture, the diagram is updated in the
  same change set.

## Open questions

- Diagram format (for example Mermaid or ASCII) and where it lives.
- Whether a rendered image is committed or only generated on demand.
- Level of detail: a single overview, or additional views per area.

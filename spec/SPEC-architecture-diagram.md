# SPEC: Architecture diagram

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Provide a diagram of the system architecture that stays in step with the
specs.

## Requirements

- The diagram shows the browser, the web server in front of the partial
  applications, the frontend, the backend, Keycloak and the database, and the
  connections between them. Planned later additions, such as the MCP server,
  are shown and marked as such.
- Components and decisions that are not yet made are marked as undecided in
  the diagram.
- The diagram is stored in the repository as text, so changes are reviewable
  in git. A rendered form may be generated from it.
- It is referenced from the architecture overview in [SPEC.md](../SPEC.md).
- The diagram is recreated on every major architecture decision (for
  example choosing the ingress product, the identity provider, the backend
  stack or the database), in the same change set as the decision. Whenever
  a spec otherwise changes the architecture, the diagram is updated too.
- A component or decision that becomes decided loses its undecided marking
  in the same update.

## Decisions

- Format: Mermaid, stored in [architecture-diagram.md](architecture-diagram.md)
  as a fenced `mermaid` block, which GitHub renders directly.
- Only the text source is committed; no rendered image.
- A single system-level overview diagram, laid out top to bottom so it
  stays readable as elements are added.
- Each sub-application may have its own, more detailed architecture diagram;
  the overview then stays at system level and does not duplicate it.
- Undecided components are drawn with dashed borders and labelled
  "(undecided)".
- Components planned for after the MVP are drawn in a muted style with a
  dotted border and labelled "(post-MVP)"; they are a separate marking from
  "undecided".

## Open questions

- None at the moment.

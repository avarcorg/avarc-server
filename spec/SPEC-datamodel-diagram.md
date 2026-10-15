# SPEC: Data model diagram

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Provide a diagram of the tables of the application's database that stays in
step with the migrations.

## Requirements

- The diagram shows every table of the schema `avarc`, its columns with their
  types and keys, and the relations between the tables. Tables of Keycloak
  and of the PostGIS extension are not shown.
- The diagram is stored in the repository as text, so changes are reviewable
  in git.
- It is referenced from the data model sections of the area specs
  ([SPEC-locations.md](SPEC-locations.md), [SPEC-users.md](SPEC-users.md)).
- Every change of the data model, that is every new or changed Flyway
  migration, updates the diagram in the same change set. A column that is
  generated or not mapped by the application is marked as such.

## Decisions

- Format: a Mermaid `erDiagram` in [datamodel-diagram.md](datamodel-diagram.md)
  as a fenced `mermaid` block, which GitHub renders directly. Only the text
  source is committed.
- The diagram shows the physical tables as the migrations create them, not
  the logical model of the area specs.

## Open questions

- None at the moment.

# SPEC: Locations

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define how locations of historical importance are represented and stored.

## Requirements

- A location has at least: an identifier, a name, a description, and a
  position.
- The initial position is a single precise GPS coordinate (WGS 84 latitude
  and longitude).
- The position representation must be able to grow later (for example
  approximate areas, regions or uncertain positions) without breaking
  existing records.
- Records track who created and last changed them, and when.

## Open questions

- Historical period/date of the site: exact, range or free text?
- Categories/tags.
- Sources and references for each location.
- Media attachments.
- How to express uncertainty of a position.

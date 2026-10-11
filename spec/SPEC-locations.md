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

## Data model (first release)

Types are logical; the storage mapping is decided with the backend.

**Location**

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Assigned by the system when the location is created, never reused, and constant for the lifetime of the record, including across import and export. |
| `name` | text | Required, non-empty. |
| `description` | text | Required, may be long. |
| `position` | Position | Required, see below. |
| `period_label` | text | Optional free text, for example "Roman, 2nd century". |
| `period_start`, `period_end` | timestamp (UTC) | Optional, `period_start` <= `period_end`; for sorting and filtering. Must be able to represent dates before the common era. |
| `tags` | set of text | Zero or more free-form tags, created on first use. |
| `references` | list of Reference | Zero or more, ordered. |
| `created_at`, `updated_at` | timestamp (UTC) | Set by the system. |
| `created_by`, `updated_by` | identity id | The Ory identity of the user, see [SPEC-auth.md](SPEC-auth.md). |

The UUID is the identity of a location in the API, in exports and in
imports. A storage layer may add its own numeric surrogate key for
optimisation; it is internal, never exposed, and never used to identify a
location across systems.

All timestamps are stored in UTC (see [SPEC.md](../SPEC.md)). A period
timestamp states a bound, not a claim of exact knowledge; imprecise dates are
described in `period_label`.

**Reference**: `citation` (text, required) and `url` (optional).

**Position** has a `kind` discriminator. The first release defines one kind,
`point`, with `latitude` and `longitude` in decimal degrees (WGS 84;
latitude -90 to 90, longitude -180 to 180).

## Extending the position

Further kinds (for example an area, a region, or a point with an uncertainty
radius) are added as new `kind` values with their own fields. Existing
records keep their kind and stay valid; consumers must ignore or reject
unknown kinds explicitly rather than misread them. The `point` kind is never
changed incompatibly.

## Decisions

- The period is a free-text label plus an optional start and end timestamp.
- Locations are identified by a UUID that survives import and export; a
  numeric database key may be added internally for optimisation.
- Tags are free-form and many-to-many; there is no fixed taxonomy.
- Sources are a list of references with a citation and an optional URL.
- Media attachments and expression of position uncertainty are not part of
  the first release; the position `kind` mechanism leaves room for both.

## Open questions

- Whether tags are normalised (case, whitespace) and by what rule.
- Language of descriptions; see the open question in [SPEC.md](../SPEC.md).

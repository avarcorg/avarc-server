# SPEC: Locations

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define how locations of historical importance are represented and stored.

## Requirements

- A location has at least: an identifier, a name, a description (both
  translatable, see below), and a position.
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
| `translations` | map language -> Translation | At least one entry, see below. |
| `position` | Position | Required, see below. |
| `confidence_level` | integer 1-5 | 1 is the lowest and 5 the highest confidence that the location (identification and position) is correct, as judged by the contributors. Required, defaults to 3. |
| `period_start`, `period_end` | timestamp (UTC) | Optional, `period_start` <= `period_end`; for sorting and filtering. Must be able to represent dates before the common era. |
| `tags` | set of tag key | Zero or more tags, see below. |
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

**Translation** (per language): `name` (text, required, non-empty),
`description` (text, required, may be long) and `period_label` (optional
free text, for example "Roman, 2nd century") and `confidence_level` (integer
1-5, 1 lowest and 5 highest: how confident the contributors are in this
translation of the content, for example 1 or 2 for an unreviewed machine
translation; required, defaults to 3).

**Reference**: `url` (optional) and `citations`, a map language -> text with
at least one entry.

**Tag**: a language-neutral `key` (unique, created on first use) and
optional `labels`, a map language -> text. A tag without a label for the
requested language is shown by its key.

**Languages** are identified by language code (`en`, `de`). The supported
languages are those named in [SPEC.md](../SPEC.md); adding one needs no data
migration.

The two `confidence_level` values are independent: one rates the facts about
the location, the other the wording in one language. Neither replaces the
expression of position uncertainty (for example a radius), which is deferred.

Position, period timestamps, URLs, identifiers and audit fields are
language-neutral.

**Position** has a `kind` discriminator. The first release defines one kind,
`point`, with `latitude` and `longitude` in decimal degrees (WGS 84;
latitude -90 to 90, longitude -180 to 180).

## Extending the position

Further kinds (for example an area, a region, or a point with an uncertainty
radius) are added as new `kind` values with their own fields. Existing
records keep their kind and stay valid; consumers must ignore or reject
unknown kinds explicitly rather than misread them. The `point` kind is never
changed incompatibly.

## Language fallback

When content is requested in a language it lacks, the value is taken from
the English entry, and if there is none, from the available entry with the
lowest language code. The same rule applies to reference citations and tag
labels, with the tag key as the final fallback. A fallback is reported to
the client so that it can mark the content as not translated.

## Decisions

- The period is a free-text label plus an optional start and end timestamp.
- Locations are identified by a UUID that survives import and export; a
  numeric database key may be added internally for optimisation.
- Tags are many-to-many and language-neutral, with per-language labels;
  there is no fixed taxonomy.
- Sources are a list of references with per-language citations and an
  optional URL.
- Translatable fields: `name`, `description`, `period_label`, reference
  citations and tag labels. Translations are stored per language; at least
  one is required, and a missing one falls back to English.
- `confidence_level`, an integer from 1 to 5, is kept on the location and on
  each translation. This scale may be revisited.
- Media attachments and expression of position uncertainty are not part of
  the first release; the position `kind` mechanism leaves room for both.

## Open questions

- The normalisation rule for tag keys (case, whitespace, allowed characters).
- Whether the API returns all translations of a location or only the
  requested language by default.

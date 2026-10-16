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

Types are logical; the storage mapping is decided with the backend. The tables
are in the [data model diagram](datamodel-diagram.md).

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
| `created_by`, `updated_by` | identity id | The Keycloak user id of the user, see [SPEC-auth.md](SPEC-auth.md). |

The UUID is the identity of a location in the API, in exports and in
imports. A storage layer may add its own numeric surrogate key for
optimisation; it is internal, never exposed, and never used to identify a
location across systems.

All timestamps are stored in UTC (see [SPEC.md](../SPEC.md)). A period
timestamp states a bound, not a claim of exact knowledge; imprecise dates are
described in `period_label`.

**Translation** (per language):
- `name`: text, required, non-empty.
- `description`: text, required, may be long.
- `period_label`: optional free text, for example "Roman, 2nd century".
- `confidence_level`: integer 1-5, 1 lowest and 5 highest, how confident the
  contributors are in this translation of the content (for example 1 or 2
  for an unreviewed machine translation). Required, defaults to 3.

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

## API

Introduced in [AVARC-10](../tasks/TASK-locations-crud-api.md). JSON under
`/api/locations` and `/api/tags`; every call needs a login and the role named in
[SPEC-auth.md](SPEC-auth.md), otherwise the answer is `401` (no session) or
`403` (role missing).

| Call | Role | Answer |
|------|------|--------|
| `GET /api/locations?page=&size=` | viewer | `200` with `items`, `page` (from 0), `size` (default 20, at most 100) and `total`; newest first. |
| `GET /api/locations/{id}` | viewer | `200` with the location, or `404`. |
| `POST /api/locations` | editor | `201` with the location and a `Location` header. |
| `PUT /api/locations/{id}` | editor | `200` with the location; replaces all content fields, or `404`. |
| `DELETE /api/locations/{id}` | editor | `204`, or `404`. |
| `GET /api/tags` | viewer | `200` with a list of `{key, labels, locations}`, ordered by key; `locations` is the number of locations that carry the tag. |
| `PUT /api/tags/{key}` | admin | `200` with the tag; creates it or replaces its labels. |

- The body of `POST` and `PUT` has `position`, `confidenceLevel` (default 3),
  `periodStart`, `periodEnd`, `translations`, `tags` and `references`; the
  identifier and the audit fields are set by the system and ignored if sent.
  A location is shown with all of those, in camelCase.
- The `tags` of a location are sent as a list of keys and shown as a list of
  `{key, labels}`. An editor may use any existing tag and may use a key that
  is unknown so far, which creates the tag without labels (they are shown by
  their key until an admin sets labels). Only an admin sets or changes the
  labels of a tag, with `PUT /api/tags/{key}`, whose body is
  `{"labels": {"<language>": "<text>"}}`; the given map replaces the labels
  (an empty map clears them). Labels are in supported languages and not
  empty. A request for a location cannot change labels.
- A request that breaks a rule of this spec answers `400` with a problem
  description: no translation, a language that is not supported, an empty
  name or description, a confidence level outside 1-5, a position outside
  the ranges or of an unknown `kind`, `periodStart` after `periodEnd`, a
  reference without a citation or with a url that is not an absolute http or
  https address, a tag key that does not follow the rule below, a tag label
  in an unsupported language or an empty one.
- `createdBy` and `updatedBy` are the Keycloak subject of the user.
- Tag keys are trimmed and lower-cased, then must be 1-64 characters of
  `a-z`, `0-9` and single hyphens inside the key. The key in the path of
  `PUT /api/tags/{key}` follows the same rule.
- The API returns every translation. The language fallback above is applied
  by the client, which knows which language it shows.

## Decisions

- The period is a free-text label plus an optional start and end timestamp.
- Locations are identified by a UUID that survives import and export; a
  numeric database key may be added internally for optimisation.
- Tags are many-to-many and language-neutral, with per-language labels;
  there is no fixed taxonomy.
- Tag usage ([AVARC-10](../tasks/TASK-locations-crud-api.md)): editors
  create tags by using a new key, admins own the labels, a tag that no
  location carries any more is kept (so its labels survive and it can be used
  again), and there is no call to delete a tag. The API lists tags for a
  picker; there is no read or delete call of a single tag.
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

- None at the moment.

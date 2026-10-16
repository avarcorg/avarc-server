---
id: AVARC-50
type: task
status: open
priority: normal
area: backend
depends-on: [AVARC-10]
created: 2026-10-16
---

# TASK: Import the legacy places as locations

Spec: [SPEC-locations.md](../spec/SPEC-locations.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md)

The places of the legacy system are in the database already, as raw tables in
the schema `legacy` (loaded with `deploy/import-sql.sh`, see
[SPEC-deployment.md](../spec/SPEC-deployment.md)). The application shows only
what is in its own tables, so they are not visible yet. This task maps them
onto locations ([AVARC-10](finished/TASK-locations-crud-api.md)) in a
repeatable import.

## The source

The legacy tables come from an Access export, with their names and column
names as they were. The ones that matter, with the number of rows in the
export:

- `poh`, the places (3,516), with a name, a description, categories, a country,
  and a reference to its coordinates.
- `georeference_poh`, the coordinates (3,518), as text columns for latitude and
  longitude, with a `srid`.
- `payload_poh`, the texts per language (3,518), with a two-letter language
  code, name, description and a briefing.
- `sources_poh` (sources), `keywords` and `poh2keyword` (a few dozen links),
  `pohtype`, and the timeline tables for periods.
- Tables of people, contributors, addresses and accounts hold personal data
  and are not imported (see below).

## Decisions to make first

- **Where the texts come from:** `poh` carries one name and description, and
  `payload_poh` one per language. Choose which wins, how a place with only
  one language is handled (the locations need at least one translation), and
  what to do with languages other than English and German.
- **Coordinates:** they are text. Parse them, check the ranges (latitude -90
  to 90, longitude -180 to 180), take the `srid` into account (convert, or
  reject what is not WGS 84), and decide what to do with a place without a
  usable position (it cannot be a location, so it goes to the report).
- **Mapping of the rest:** categories and keywords to tags (with labels or
  only keys, following the tag rules of
  [SPEC-locations.md](../spec/SPEC-locations.md)), sources to references, the
  period from the timeline tables (or only a free-text label), and a
  confidence level (the default 3 unless the legacy data says more).
- **Identity and repeatability:** a place keeps a link to its legacy id so that
  a second run updates what a first run made and does not create duplicates;
  decide where the link lives (a small mapping table, or a column), and
  record it in the data model diagram and the spec.
- **How it runs:** the API needs a login of a person and takes one location at
  a time, which suits a few records but not thousands, so the likely answer is
  a script run on the host of the environment, like `deploy/import-sql.sh`:
  SQL in one transaction that reads the schema `legacy` and writes the tables
  of the application, with the same rules the API checks (the constraints of
  the tables already enforce ranges, confidence and period order). Decide
  between that and a program, and record why.
- **Audit fields:** `created_by` and `updated_by` hold a Keycloak subject; use
  a fixed value that names the import, not a person.
- **Personal data:** the contributor and address tables stay out of the
  application. Decide whether the schema `legacy` is dropped after the import,
  and when (it is included in the database backups,
  [AVARC-48](TASK-database-backup.md)).

## Remaining

- Specify the mapping in `SPEC-locations.md` (or a spec of its own) once the
  decisions are taken, and show the link table in the data model diagram.
- Write the import, with a dry run that changes nothing and reports what it
  would do, and a report of every place that was not imported and why.
- Run it on dev against a copy of the legacy data, check counts and a sample
  by hand on the map, then on stage.
- Tests for the mapping rules (coordinate parsing, language choice) on a few
  invented rows.

## Verification

The number of locations equals the number of legacy places minus the ones in
the report, each reported place has a reason, a second run changes nothing, a
sample of places looks right on the map and on its detail page in both
languages, and no table with personal data is read by the import.

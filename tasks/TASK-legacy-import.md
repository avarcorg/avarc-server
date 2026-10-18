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
- `contributor`, `person`, `user`, `address` and the like hold personal data.
  `poh` names the contributor of a place; that is the only link the import
  needs from them (see the audit fields below), and none of their content is
  copied into the application.

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
- **Idempotent synchronisation:** the import is a synchronising script, not a
  one-off load, and it must be idempotent: running it again on unchanged
  legacy data changes nothing (no duplicate location, tag or reference, no
  change of `created_at`, `created_by` or of a row's data, no new row in any
  table), and running it after the legacy data or the mapping changed brings
  the locations to the new state, and only those. This needs:
  - a link from a place to its legacy id (decide where it lives: a small
    mapping table, or a column; record it in the data model diagram and the
    spec), so a place is found again instead of created again;
  - a rule for what a rerun does with a location that was changed in the
    application since the import (the application wins, or the import wins;
    decide, and record it), and with a legacy place that has disappeared (kept,
    marked in the report, or removed);
  - upserts for tags and references, and the same ordering every time, so a
    rerun writes nothing;
  - the Keycloak users and the contributor mapping below to be idempotent as
    well: an existing user is found and reused, never created twice, and a
    rerun does not print or reset a password;
  - a run that stops half way (an error, a lost connection) to leave nothing
    half imported: one transaction, or a state that the next run completes.
- **How it runs:** the API needs a login of a person and takes one location at
  a time, which suits a few records but not thousands, so the likely answer is
  a script run on the host of the environment, like `deploy/import-sql.sh`:
  SQL in one transaction that reads the schema `legacy` and writes the tables
  of the application, with the same rules the API checks (the constraints of
  the tables already enforce ranges, confidence and period order). Decide
  between that and a program, and record why.
- **Audit fields, a stable mapping to Keycloak users:** `created_by` and
  `updated_by` hold the Keycloak subject of a user
  ([SPEC-locations.md](../spec/SPEC-locations.md)), so each legacy contributor
  that is to appear as the author of a place needs a Keycloak user. Most
  likely those users have to be created in Keycloak first, with
  `deploy/create-user.sh` or the admin console, and then mapped. The mapping
  from a legacy contributor to a Keycloak subject is data of its own: kept in
  a file or table that is not in git (it names people), stable across runs, so
  that the same contributor always yields the same subject, and complete before
  the import starts (a place whose contributor has no entry goes to the report,
  or to a fixed "legacy import" subject if that is decided; say which). Decide
  how the users are created (invited with a one-time password, or without a
  login until needed), which roles they get, and who creates them. The
  subject of a user comes from the `sub` claim, which Keycloak assigns when
  the account is created, so it exists before the person has ever logged in.
- **Personal data:** the names, addresses and accounts of the legacy tables
  stay out of the application; the mapping above is the only place that
  connects a contributor to a user. Decide whether the schema `legacy` is
  dropped after the import, and when (it is included in the database backups,
  [AVARC-48](finished/TASK-database-backup.md)).

## Keeping the import current

The import writes into the tables of the application, so it depends on their
shape and on the rules of the locations spec. Every change of the data model
(a new or changed migration, which already updates the
[data model diagram](../spec/datamodel-diagram.md)) or of the locations rules
([SPEC-locations.md](../spec/SPEC-locations.md): fields, languages, tag keys,
ranges) must be followed by a check of this import: does the mapping still
fill every required column, do the new rules still hold for what it writes,
does the dry run still pass. Until the import has been used for good, that is
part of such a change and not a separate task; the mapping spec says so, and
`AGENTS.md` names the import next to the diagrams that are kept current. The
dry run on a copy of the legacy data is the check, and a test with invented
rows keeps it from rotting.

## Status

Decided and specified in `SPEC-locations.md` ("Legacy import"); the import
(`deploy/import-legacy.sql` and `.sh`, migration V4 with the link table) and
its tests are written. The task stays open: the import is revisited after
data model changes, and it has not been run on dev or stage for good yet.

## Remaining (as planned originally)

- Specify the mapping in `SPEC-locations.md` (or a spec of its own) once the
  decisions are taken, and show the link table in the data model diagram. Add
  the rule of "Keeping the import current" to the spec and to `AGENTS.md`.
- Create the Keycloak users of the contributors that need one, and build the
  contributor-to-subject mapping before the first run.
- Write the import, with a dry run that changes nothing and reports what it
  would do, and a report of every place that was not imported and why.
- Run it on dev against a copy of the legacy data, check counts and a sample
  by hand on the map, then on stage.
- Tests for the mapping rules (coordinate parsing, language choice) on a few
  invented rows, and a test that runs the import twice on them and finds the
  second run a no-op, and one that changes a row between runs and finds only
  that location changed.

## Verification

The number of locations equals the number of legacy places minus the ones in
the report, each reported place has a reason, a second run on the same data
changes nothing (compare a dump of the application's tables before and after;
the rows and the audit timestamps are identical), a run after a change of one
legacy place changes that location only, a
sample of places looks right on the map and on its detail page in both
languages, every `created_by` and `updated_by` is the mapped Keycloak subject
of the contributor (or the decided fixed value), and the import reads nothing
of the personal data of the legacy tables except the contributor link.

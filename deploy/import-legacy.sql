-- Synchronises the tables of the application with the schema legacy
-- (AVARC-50, rules in spec/SPEC-locations.md). Run by import-legacy.sh in one
-- transaction; psql variable dry=on rolls it back. Idempotent: a rerun on
-- unchanged data writes nothing. The contributor tables are not read.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path TO avarc, public;
SET LOCAL TIME ZONE 'UTC';

CREATE FUNCTION pg_temp.slug(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
    SELECT btrim(left(btrim(regexp_replace(
        replace(replace(replace(replace(lower(t), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
        '[^a-z0-9]+', '-', 'g'), '-'), 64), '-')
$$;

-- The places with their cleaned coordinates and the German and English texts.
CREATE TEMP TABLE src ON COMMIT DROP AS
SELECT p."ID" AS legacy_id,
       regexp_replace(btrim(g.latitude), '\.$', '') AS lat_text,
       regexp_replace(btrim(g.longitude), '\.$', '') AS lon_text,
       g.srid, g.creation
FROM legacy.poh p
JOIN legacy.georeference_poh g ON g."ID" = p."georeference_poh_ID";

CREATE TEMP TABLE parsed ON COMMIT DROP AS
SELECT legacy_id, srid, creation,
       CASE WHEN lat_text ~ '^-?[0-9]+(\.[0-9]+)?$' AND lon_text ~ '^-?[0-9]+(\.[0-9]+)?$' THEN lat_text::numeric END AS lat,
       CASE WHEN lat_text ~ '^-?[0-9]+(\.[0-9]+)?$' AND lon_text ~ '^-?[0-9]+(\.[0-9]+)?$' THEN lon_text::numeric END AS lon
FROM src;

-- Some places have latitude and longitude the wrong way round (a latitude
-- below 30 with a longitude of 40 to 60); they are swapped and counted.
CREATE TEMP TABLE swapped ON COMMIT DROP AS
SELECT legacy_id FROM parsed WHERE lat < 30 AND lon BETWEEN 40 AND 60;

CREATE TEMP TABLE place ON COMMIT DROP AS
SELECT p.legacy_id,
       (CASE WHEN w.legacy_id IS NULL THEN p.lat ELSE p.lon END)::double precision AS latitude,
       (CASE WHEN w.legacy_id IS NULL THEN p.lon ELSE p.lat END)::double precision AS longitude,
       p.creation
FROM parsed p LEFT JOIN swapped w USING (legacy_id)
WHERE p.lat IS NOT NULL AND p.srid = '4326'
  AND CASE WHEN w.legacy_id IS NULL THEN p.lat ELSE p.lon END BETWEEN -90 AND 90
  AND CASE WHEN w.legacy_id IS NULL THEN p.lon ELSE p.lat END BETWEEN -180 AND 180;

CREATE TEMP TABLE text_of ON COMMIT DROP AS
SELECT l.legacy_id, l.language,
       coalesce(nullif(btrim(x.name), ''), CASE WHEN l.language = 'de' THEN nullif(btrim(p.name), '') END) AS name,
       coalesce(nullif(x.description, ''), CASE WHEN l.language = 'de' THEN nullif(p.description, '') END, '') AS description
FROM (SELECT "ID" AS legacy_id, 'de' AS language FROM legacy.poh
      UNION ALL SELECT "poh_ID", 'en' FROM legacy.payload_poh WHERE language = 'GB') l
JOIN legacy.poh p ON p."ID" = l.legacy_id
LEFT JOIN (SELECT DISTINCT ON ("poh_ID", language) * FROM legacy.payload_poh ORDER BY "poh_ID", language, "ID") x
       ON x."poh_ID" = l.legacy_id AND x.language = CASE l.language WHEN 'de' THEN 'DE' ELSE 'GB' END;

-- Places that become locations, and the reasons for the others.
CREATE TEMP TABLE report ON COMMIT DROP AS
SELECT s.legacy_id,
       CASE WHEN pl.legacy_id IS NULL THEN 'no usable position' ELSE 'no name' END AS reason
FROM src s
LEFT JOIN place pl USING (legacy_id)
WHERE pl.legacy_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM text_of t WHERE t.legacy_id = s.legacy_id AND t.name IS NOT NULL)
UNION ALL
SELECT "ID", 'no coordinates row' FROM legacy.poh p
WHERE NOT EXISTS (SELECT 1 FROM src s WHERE s.legacy_id = p."ID")
UNION ALL
SELECT m.legacy_id, 'gone from legacy, location kept' FROM location_legacy m
WHERE NOT EXISTS (SELECT 1 FROM legacy.poh p WHERE p."ID" = m.legacy_id);

DELETE FROM place WHERE legacy_id IN (SELECT legacy_id FROM report);
DELETE FROM text_of WHERE name IS NULL OR legacy_id NOT IN (SELECT legacy_id FROM place);

CREATE TEMP TABLE changed (location_id uuid PRIMARY KEY) ON COMMIT DROP;
CREATE TEMP TABLE created (location_id uuid PRIMARY KEY) ON COMMIT DROP;

-- Locations: create the missing ones, bring the others to the legacy state.
CREATE TEMP TABLE new_id ON COMMIT DROP AS
SELECT legacy_id, gen_random_uuid() AS location_id FROM place
WHERE legacy_id NOT IN (SELECT legacy_id FROM location_legacy)
ORDER BY legacy_id;

WITH ins AS (
    INSERT INTO location (id, position_kind, latitude, longitude, created_at, updated_at, created_by, updated_by)
    SELECT n.location_id, 'point', p.latitude, p.longitude, coalesce(p.creation AT TIME ZONE 'UTC', now()), now(),
           'legacy-import', 'legacy-import'
    FROM new_id n JOIN place p USING (legacy_id)
    RETURNING id),
 lnk AS (
    INSERT INTO location_legacy (legacy_id, location_id) SELECT legacy_id, location_id FROM new_id RETURNING location_id)
INSERT INTO created SELECT id FROM ins;
INSERT INTO changed SELECT location_id FROM created;

CREATE TEMP TABLE target ON COMMIT DROP AS
SELECT m.legacy_id, m.location_id FROM location_legacy m JOIN place p USING (legacy_id);

WITH upd AS (
    UPDATE location l SET latitude = p.latitude, longitude = p.longitude,
                          created_by = 'legacy-import', updated_by = 'legacy-import'
    FROM target t JOIN place p USING (legacy_id)
    WHERE l.id = t.location_id
      AND (l.latitude, l.longitude, l.created_by, l.updated_by)
          IS DISTINCT FROM (p.latitude, p.longitude, 'legacy-import', 'legacy-import')
    RETURNING l.id)
INSERT INTO changed SELECT id FROM upd ON CONFLICT DO NOTHING;

-- Translations.
WITH del AS (
    DELETE FROM location_translation lt USING target t
    WHERE lt.location_id = t.location_id AND lt.language IN ('de', 'en')
      AND NOT EXISTS (SELECT 1 FROM text_of x WHERE x.legacy_id = t.legacy_id AND x.language = lt.language)
    RETURNING lt.location_id)
INSERT INTO changed SELECT location_id FROM del ON CONFLICT DO NOTHING;

WITH up AS (
    INSERT INTO location_translation (location_id, language, name, description)
    SELECT t.location_id, x.language, x.name, x.description FROM text_of x JOIN target t USING (legacy_id)
    ON CONFLICT (location_id, language) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
        WHERE (location_translation.name, location_translation.description) IS DISTINCT FROM (EXCLUDED.name, EXCLUDED.description)
    RETURNING location_id)
INSERT INTO changed SELECT location_id FROM up ON CONFLICT DO NOTHING;

-- Tags: the type of the place and its keywords.
CREATE TEMP TABLE tag_of ON COMMIT DROP AS
SELECT DISTINCT p."ID" AS legacy_id, pg_temp.slug(ty.description) AS key, ty.description AS label,
       NULL::text AS label_en
FROM legacy.poh p JOIN legacy.pohtype ty ON ty.identifier = p."pohType_ID"
WHERE ty.description <> 'ToDo'
UNION
SELECT k."poh_ID", pg_temp.slug(k.keyword), k.keyword, NULL FROM legacy.poh2keyword k
UNION
SELECT legacy_id, 'coordinates-swapped', 'Koordinaten vertauscht', 'Coordinates swapped' FROM swapped;
DELETE FROM tag_of WHERE key = '' OR legacy_id NOT IN (SELECT legacy_id FROM place);

INSERT INTO tag (key, labels)
SELECT key, jsonb_strip_nulls(jsonb_build_object('de', min(label), 'en', min(label_en))) FROM tag_of GROUP BY key
ON CONFLICT (key) DO NOTHING;

WITH del AS (
    DELETE FROM location_tag lt USING target t
    WHERE lt.location_id = t.location_id
      AND NOT EXISTS (SELECT 1 FROM tag_of o WHERE o.legacy_id = t.legacy_id AND o.key = lt.tag_key)
    RETURNING lt.location_id)
INSERT INTO changed SELECT location_id FROM del ON CONFLICT DO NOTHING;

WITH ins AS (
    INSERT INTO location_tag (location_id, tag_key)
    SELECT t.location_id, o.key FROM tag_of o JOIN target t USING (legacy_id)
    ON CONFLICT DO NOTHING RETURNING location_id)
INSERT INTO changed SELECT location_id FROM ins ON CONFLICT DO NOTHING;

-- References: the sources, in the order of their legacy ids.
CREATE TEMP TABLE ref_of ON COMMIT DROP AS
SELECT s.poi_id AS legacy_id,
       (row_number() OVER (PARTITION BY s.poi_id ORDER BY s."ID") - 1)::int AS ordinal,
       CASE WHEN btrim(s.source) ~ '^https?://' THEN btrim(s.source) END AS url,
       jsonb_build_object('de', coalesce(nullif(btrim(s.description), ''), nullif(btrim(s.source), ''))) AS citations
FROM legacy.sources_poh s
WHERE coalesce(nullif(btrim(s.description), ''), nullif(btrim(s.source), '')) IS NOT NULL
  AND s.poi_id IN (SELECT legacy_id FROM place);

WITH del AS (
    DELETE FROM location_reference r USING target t
    WHERE r.location_id = t.location_id
      AND NOT EXISTS (SELECT 1 FROM ref_of o WHERE o.legacy_id = t.legacy_id AND o.ordinal = r.ordinal)
    RETURNING r.location_id)
INSERT INTO changed SELECT location_id FROM del ON CONFLICT DO NOTHING;

WITH up AS (
    INSERT INTO location_reference (location_id, ordinal, url, citations)
    SELECT t.location_id, o.ordinal, o.url, o.citations FROM ref_of o JOIN target t USING (legacy_id)
    ON CONFLICT (location_id, ordinal) DO UPDATE SET url = EXCLUDED.url, citations = EXCLUDED.citations
        WHERE (location_reference.url, location_reference.citations) IS DISTINCT FROM (EXCLUDED.url, EXCLUDED.citations)
    RETURNING location_id)
INSERT INTO changed SELECT location_id FROM up ON CONFLICT DO NOTHING;

UPDATE location SET updated_at = now() WHERE id IN (SELECT location_id FROM changed);

\echo Places not imported or kept without legacy source:
SELECT reason, count(*) AS places, min(legacy_id) AS first_id FROM report GROUP BY reason ORDER BY reason;
\echo Places with swapped coordinates, corrected:
SELECT count(*) AS swapped FROM swapped WHERE legacy_id IN (SELECT legacy_id FROM place);
\echo Locations created, changed (including created), and unchanged:
SELECT (SELECT count(*) FROM created) AS created,
       (SELECT count(*) FROM changed) AS changed,
       (SELECT count(*) FROM target) - (SELECT count(*) FROM changed) AS unchanged;

\if :{?dry}
\else
    \set dry off
\endif
\if :dry
    \echo Dry run, rolled back.
    ROLLBACK;
\else
    COMMIT;
\endif

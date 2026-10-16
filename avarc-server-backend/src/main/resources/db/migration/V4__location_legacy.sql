-- Finds the location of a legacy place again on a rerun of the legacy import
-- (AVARC-50). Dropped together with the legacy system.
CREATE TABLE avarc.location_legacy (
    legacy_id   integer PRIMARY KEY,
    location_id uuid    NOT NULL UNIQUE REFERENCES avarc.location ON DELETE CASCADE
);

CREATE TABLE avarc.location (
    id               uuid PRIMARY KEY,
    position_kind    text             NOT NULL,
    latitude         double precision,
    longitude        double precision,
    -- generated from the columns above; the application does not touch it
    position         geography(Point, 4326) GENERATED ALWAYS AS (
                         CASE WHEN position_kind = 'point'
                              THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                         END) STORED,
    confidence_level integer          NOT NULL DEFAULT 3,
    period_start     timestamptz,
    period_end       timestamptz,
    created_at       timestamptz      NOT NULL,
    updated_at       timestamptz      NOT NULL,
    created_by       text             NOT NULL,
    updated_by       text             NOT NULL,
    CONSTRAINT location_position_kind CHECK (position_kind IN ('point')),
    CONSTRAINT location_point CHECK (position_kind <> 'point' OR (
        latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)),
    CONSTRAINT location_confidence CHECK (confidence_level BETWEEN 1 AND 5),
    CONSTRAINT location_period CHECK (period_start IS NULL OR period_end IS NULL OR period_start <= period_end)
);

CREATE INDEX location_position_idx ON avarc.location USING gist (position);
CREATE INDEX location_created_idx ON avarc.location (created_at DESC, id);

CREATE TABLE avarc.location_translation (
    location_id      uuid     NOT NULL REFERENCES avarc.location ON DELETE CASCADE,
    language         text     NOT NULL,
    name             text     NOT NULL CHECK (name <> ''),
    description      text     NOT NULL,
    period_label     text,
    confidence_level integer  NOT NULL DEFAULT 3 CHECK (confidence_level BETWEEN 1 AND 5),
    PRIMARY KEY (location_id, language)
);

CREATE TABLE avarc.tag (
    key    text  PRIMARY KEY,
    labels jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE avarc.location_tag (
    location_id uuid NOT NULL REFERENCES avarc.location ON DELETE CASCADE,
    tag_key     text NOT NULL REFERENCES avarc.tag,
    PRIMARY KEY (location_id, tag_key)
);

CREATE TABLE avarc.location_reference (
    location_id uuid    NOT NULL REFERENCES avarc.location ON DELETE CASCADE,
    ordinal     integer NOT NULL,
    url         text,
    citations   jsonb   NOT NULL,
    PRIMARY KEY (location_id, ordinal)
);

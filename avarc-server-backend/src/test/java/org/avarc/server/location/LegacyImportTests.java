package org.avarc.server.location;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import org.avarc.server.TestDatabase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.Container.ExecResult;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

/** Runs deploy/import-legacy.sql with psql on a few invented legacy rows. */
@Import(TestDatabase.class)
@SpringBootTest
class LegacyImportTests {

    private static final Path SCRIPT = Path.of("..", "deploy", "import-legacy.sql");

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private PostgreSQLContainer postgis;

    @BeforeEach
    void invent() {
        jdbc.execute("DROP SCHEMA IF EXISTS legacy CASCADE");
        jdbc.execute("DELETE FROM avarc.location");
        jdbc.execute("""
            CREATE SCHEMA legacy;
            CREATE TABLE legacy.poh ("ID" int, name text, description text, "georeference_poh_ID" int, "pohType_ID" int);
            CREATE TABLE legacy.georeference_poh ("ID" int, latitude text, longitude text, srid text, creation timestamp);
            CREATE TABLE legacy.payload_poh ("ID" int, "poh_ID" int, name text, description text, language text);
            CREATE TABLE legacy.pohtype ("ID" int, identifier int, description text);
            CREATE TABLE legacy.poh2keyword (keyword text, "poh_ID" int);
            CREATE TABLE legacy.sources_poh ("ID" int, poi_id int, source text, description text);
            INSERT INTO legacy.pohtype VALUES (1, 1, 'Brücke'), (2, 2, 'ToDo');
            INSERT INTO legacy.poh VALUES (1, 'Alt', 'Text', 1, 1), (2, 'Bad', '', 2, 2), (3, 'Dot', '', 3, 1), (4, 'Swap', '', 4, 1);
            INSERT INTO legacy.georeference_poh VALUES
                (1, '48.1', '11.5', '4326', '2020-01-02'), (2, '95', '11.5', '4326', NULL),
                (3, ' 47.5.', '12', '4326', NULL), (4, '16.4', '47.7', '4326', NULL);
            INSERT INTO legacy.payload_poh VALUES
                (1, 1, 'Brücke eins', 'Beschreibung', 'DE'), (2, 1, 'Bridge one', 'Description', 'GB');
            INSERT INTO legacy.poh2keyword VALUES ('Zwangsarbeit', 1);
            INSERT INTO legacy.sources_poh VALUES (1, 1, 'https://example.org/a', ''), (2, 1, 'Buch', 'Ein Buch');
            """);
    }

    private ExecResult run() throws IOException, InterruptedException {
        postgis.copyFileToContainer(MountableFile.forHostPath(SCRIPT), "/tmp/import-legacy.sql");
        return postgis.execInContainer(
                "psql",
                "-X",
                "-q",
                "-v",
                "ON_ERROR_STOP=1",
                "-U",
                postgis.getUsername(),
                "-d",
                postgis.getDatabaseName(),
                "-f",
                "/tmp/import-legacy.sql");
    }

    /** The legacy id and update time of each location, by legacy id. */
    private List<String> updates() {
        return jdbc.queryForList("""
            SELECT m.legacy_id || ' ' || l.updated_at FROM avarc.location l
            JOIN avarc.location_legacy m ON m.location_id = l.id ORDER BY m.legacy_id\
            """, String.class);
    }

    private String snapshot() {
        return jdbc.queryForObject("""
            SELECT string_agg(x, '|' ORDER BY x) FROM (
              SELECT row_to_json(l)::text x FROM avarc.location l
              UNION ALL SELECT row_to_json(t)::text FROM avarc.location_translation t
              UNION ALL SELECT row_to_json(t)::text FROM avarc.tag t
              UNION ALL SELECT row_to_json(t)::text FROM avarc.location_tag t
              UNION ALL SELECT row_to_json(r)::text FROM avarc.location_reference r
              UNION ALL SELECT row_to_json(m)::text FROM avarc.location_legacy m) s
            """, String.class);
    }

    @Test
    void importsMapsAndReportsPlaces() throws Exception {
        ExecResult result = run();
        assertThat(result.getExitCode()).as(result.getStderr()).isZero();
        assertThat(result.getStdout()).contains("no usable position");

        assertThat(jdbc.queryForObject("SELECT count(*) FROM avarc.location", Integer.class))
                .isEqualTo(3);
        assertThat(jdbc.queryForObject("""
            SELECT l.latitude FROM avarc.location l JOIN avarc.location_legacy m ON m.location_id = l.id
            WHERE m.legacy_id = 3\
            """, Double.class)).isEqualTo(47.5);
        assertThat(jdbc.queryForObject("""
            SELECT l.latitude || ' ' || l.longitude FROM avarc.location l JOIN avarc.location_legacy m ON m.location_id = l.id
            WHERE m.legacy_id = 4\
            """, String.class)).isEqualTo("47.7 16.4");
        assertThat(result.getStdout()).contains("swapped");
        assertThat(jdbc.queryForList("""
            SELECT tag_key FROM avarc.location_tag t JOIN avarc.location_legacy m USING (location_id)
            WHERE m.legacy_id = 4 AND tag_key LIKE 'coord%'\
            """, String.class)).containsExactly("coordinates-swapped");
        assertThat(jdbc.queryForObject(
                        "SELECT labels ->> 'en' FROM avarc.tag WHERE key = 'coordinates-swapped'", String.class))
                .isEqualTo("Coordinates swapped");
        assertThat(jdbc.queryForList("""
            SELECT language FROM avarc.location_translation t JOIN avarc.location_legacy m USING (location_id)
            WHERE m.legacy_id = 1 ORDER BY language\
            """, String.class)).containsExactly("de", "en");
        assertThat(jdbc.queryForList("""
            SELECT tag_key FROM avarc.location_tag t JOIN avarc.location_legacy m USING (location_id)
            WHERE m.legacy_id = 1 ORDER BY tag_key\
            """, String.class)).containsExactly("bruecke", "zwangsarbeit");
        assertThat(jdbc.queryForList("""
            SELECT url FROM avarc.location_reference r JOIN avarc.location_legacy m USING (location_id)
            WHERE m.legacy_id = 1 ORDER BY ordinal\
            """, String.class)).containsExactly("https://example.org/a", null);
        assertThat(jdbc.queryForList("SELECT DISTINCT created_by FROM avarc.location", String.class))
                .containsExactly("legacy-import");
    }

    @Test
    void secondRunChangesNothingAndAChangedPlaceChangesOnlyThatLocation() throws Exception {
        run();
        String first = snapshot();
        run();
        assertThat(snapshot()).isEqualTo(first);

        List<String> before = updates();
        jdbc.execute("UPDATE legacy.payload_poh SET name = 'Brücke zwei' WHERE \"ID\" = 1");
        run();
        List<String> after = updates();
        assertThat(after).hasSameSizeAs(before);
        assertThat(after.get(0)).isNotEqualTo(before.get(0));
        assertThat(after.get(1)).isEqualTo(before.get(1));
        assertThat(jdbc.queryForObject("""
            SELECT name FROM avarc.location_translation t JOIN avarc.location_legacy m USING (location_id)
            WHERE m.legacy_id = 1 AND language = 'de'\
            """, String.class)).isEqualTo("Brücke zwei");
    }

    @Test
    void dryRunRollsBack() throws Exception {
        postgis.copyFileToContainer(MountableFile.forHostPath(SCRIPT), "/tmp/import-legacy.sql");
        ExecResult result = postgis.execInContainer(
                "psql",
                "-X",
                "-q",
                "-v",
                "ON_ERROR_STOP=1",
                "-v",
                "dry=on",
                "-U",
                postgis.getUsername(),
                "-d",
                postgis.getDatabaseName(),
                "-f",
                "/tmp/import-legacy.sql");
        assertThat(result.getExitCode()).as(result.getStderr()).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM avarc.location", Integer.class))
                .isZero();
    }
}

package org.avarc.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.avarc.server.TestDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OidcLoginRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Import(TestDatabase.class)
@SpringBootTest
@AutoConfigureMockMvc
class LocationTests {

    private static final String BODY = """
        {"position": {"kind": "point", "latitude": 41.8902, "longitude": 12.4922},
         "confidenceLevel": 4,
         "periodStart": "0080-01-01T00:00:00Z", "periodEnd": "0120-01-01T00:00:00Z",
         "translations": {
           "en": {"name": "Colosseum", "description": "An amphitheatre.", "periodLabel": "Roman, 1st century"},
           "de": {"name": "Kolosseum", "description": "Ein Amphitheater.", "confidenceLevel": 2}},
         "tags": [" Roman ", "arena"],
         "references": [{"url": "https://example.org/a", "citations": {"en": "Smith 1999"}},
                        {"citations": {"de": "Müller 2001"}}]}
        """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private JdbcTemplate jdbc;

    private static OidcLoginRequestPostProcessor as(String subject, String... roles) {
        SimpleGrantedAuthority[] authorities = new SimpleGrantedAuthority[roles.length];
        for (int i = 0; i < roles.length; i++) {
            authorities[i] = new SimpleGrantedAuthority("ROLE_" + roles[i]);
        }
        return oidcLogin().idToken(token -> token.subject(subject)).authorities(authorities);
    }

    private static OidcLoginRequestPostProcessor viewer() {
        return as("viewer-sub", "viewer");
    }

    private static OidcLoginRequestPostProcessor editor() {
        return as("editor-sub", "viewer", "editor");
    }

    private ResultActions send(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
            OidcLoginRequestPostProcessor user,
            String body)
            throws Exception {
        return mockMvc.perform(request.with(user)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private JsonNode create(String body) throws Exception {
        String response = send(post("/api/locations"), editor(), body)
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return json.readTree(response);
    }

    @Test
    void everyCallNeedsALogin() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(get("/api/locations")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/locations/" + id)).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/locations")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/locations/" + id)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/locations/" + id).with(csrf())).andExpect(status().isUnauthorized());
    }

    @Test
    void aViewerReadsButDoesNotChange() throws Exception {
        String id = create(BODY).get("id").asText();
        mockMvc.perform(get("/api/locations").with(viewer())).andExpect(status().isOk());
        mockMvc.perform(get("/api/locations/" + id).with(viewer())).andExpect(status().isOk());
        send(post("/api/locations"), viewer(), BODY).andExpect(status().isForbidden());
        send(put("/api/locations/" + id), viewer(), BODY).andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/locations/" + id).with(viewer()).with(csrf()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/locations/" + id).with(viewer())).andExpect(status().isOk());
    }

    @Test
    void anAdminMayChangeToo() throws Exception {
        send(post("/api/locations"), as("admin-sub", "viewer", "admin"), BODY).andExpect(status().isCreated());
    }

    @Test
    void createStoresAndShowsEverything() throws Exception {
        String response = send(post("/api/locations"), editor(), BODY)
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.startsWith("/api/locations/")))
                .andExpect(jsonPath("$.position.kind").value("point"))
                .andExpect(jsonPath("$.position.latitude").value(41.8902))
                .andExpect(jsonPath("$.confidenceLevel").value(4))
                .andExpect(jsonPath("$.periodStart").value("0080-01-01T00:00:00Z"))
                .andExpect(jsonPath("$.translations.en.name").value("Colosseum"))
                .andExpect(jsonPath("$.translations.en.confidenceLevel").value(3))
                .andExpect(jsonPath("$.translations.de.confidenceLevel").value(2))
                .andExpect(jsonPath("$.tags[0].key").value("arena"))
                .andExpect(jsonPath("$.tags[1].key").value("roman"))
                .andExpect(jsonPath("$.tags[1].labels").isEmpty())
                .andExpect(jsonPath("$.references[0].url").value("https://example.org/a"))
                .andExpect(jsonPath("$.references[1].citations.de").value("Müller 2001"))
                .andExpect(jsonPath("$.createdBy").value("editor-sub"))
                .andExpect(jsonPath("$.updatedBy").value("editor-sub"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = json.readTree(response).get("id").asText();

        mockMvc.perform(get("/api/locations/" + id).with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.translations.de.name").value("Kolosseum"))
                .andExpect(jsonPath("$.references.length()").value(2));

        // the generated geography column follows latitude and longitude
        Double distance = jdbc.queryForObject(
                "SELECT ST_Distance(position, ST_SetSRID(ST_MakePoint(12.4922, 41.8902), 4326)::geography) FROM"
                        + " avarc.location WHERE id = ?",
                Double.class,
                UUID.fromString(id));
        assertThat(distance).isLessThan(0.01);
    }

    @Test
    void periodsBeforeTheCommonEraAreKept() throws Exception {
        String body = BODY.replace("0080-01-01T00:00:00Z", "-0500-01-01T00:00:00Z");
        String id = create(body).get("id").asText();
        mockMvc.perform(get("/api/locations/" + id).with(viewer()))
                .andExpect(jsonPath("$.periodStart").value("-0500-01-01T00:00:00Z"));
    }

    @Test
    void updateReplacesTheContentAndTheAuditFields() throws Exception {
        JsonNode created = create(BODY);
        String id = created.get("id").asText();
        String changed = """
            {"position": {"kind": "point", "latitude": 1, "longitude": 2},
             "translations": {"en": {"name": "Rome", "description": "A city."}},
             "tags": ["roman"]}
            """;
        send(put("/api/locations/" + id), as("other-sub", "editor"), changed)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.position.latitude").value(1.0))
                .andExpect(jsonPath("$.confidenceLevel").value(3))
                .andExpect(jsonPath("$.periodStart").doesNotExist())
                .andExpect(jsonPath("$.translations.de").doesNotExist())
                .andExpect(jsonPath("$.references.length()").value(0))
                .andExpect(jsonPath("$.tags.length()").value(1))
                .andExpect(jsonPath("$.tags[0].key").value("roman"))
                .andExpect(jsonPath("$.createdBy").value("editor-sub"))
                .andExpect(jsonPath("$.updatedBy").value("other-sub"))
                .andExpect(
                        jsonPath("$.createdAt").value(created.get("createdAt").asText()));
        mockMvc.perform(get("/api/locations/" + id).with(viewer()))
                .andExpect(jsonPath("$.translations.en.name").value("Rome"));
    }

    @Test
    void deleteRemovesTheLocation() throws Exception {
        String id = create(BODY).get("id").asText();
        mockMvc.perform(delete("/api/locations/" + id).with(editor()).with(csrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/locations/" + id).with(viewer())).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/locations/" + id).with(editor()).with(csrf()))
                .andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM avarc.location_translation WHERE location_id = ?",
                        Integer.class,
                        UUID.fromString(id)))
                .isZero();
    }

    @Test
    void unknownLocationsAnswer404() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(get("/api/locations/" + id).with(viewer())).andExpect(status().isNotFound());
        send(put("/api/locations/" + id), editor(), BODY).andExpect(status().isNotFound());
    }

    @Test
    void listIsPagedNewestFirst() throws Exception {
        String first = create(BODY).get("id").asText();
        String second = create(BODY).get("id").asText();
        mockMvc.perform(get("/api/locations?page=0&size=1").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(second))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        assertThat(first).isNotEqualTo(second);
        mockMvc.perform(get("/api/locations?size=0").with(viewer())).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/locations?size=101").with(viewer())).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/locations?page=-1").with(viewer())).andExpect(status().isBadRequest());
    }

    @Test
    void rejectedRequestsAnswer400AndChangeNothing() throws Exception {
        String[] bad = {
            BODY.replace("\"kind\": \"point\"", "\"kind\": \"area\""),
            BODY.replace("41.8902", "91"),
            BODY.replace("12.4922", "-181"),
            BODY.replace("\"confidenceLevel\": 4", "\"confidenceLevel\": 6"),
            BODY.replace("\"confidenceLevel\": 2", "\"confidenceLevel\": 0"),
            BODY.replace("0080-01-01", "0130-01-01"),
            BODY.replace("\"en\": {\"name\": \"Colosseum\"", "\"fr\": {\"name\": \"Colosseum\""),
            BODY.replace("Colosseum", " "),
            BODY.replace("An amphitheatre.", ""),
            BODY.replace("\"arena\"", "\"Bad Key\""),
            BODY.replace("\"arena\"", "\"roman\""),
            BODY.replace("https://example.org/a", "javascript:alert(1)"),
            BODY.replace("{\"en\": \"Smith 1999\"}", "{}"),
            "{\"position\": {\"kind\": \"point\", \"latitude\": 1, \"longitude\": 2}, \"translations\": {}}",
            "{\"translations\": {\"en\": {\"name\": \"a\", \"description\": \"b\"}}}",
        };
        int before = jdbc.queryForObject("SELECT count(*) FROM avarc.location", Integer.class);
        for (String body : bad) {
            send(post("/api/locations"), editor(), body).andExpect(status().isBadRequest());
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM avarc.location", Integer.class))
                .isEqualTo(before);
    }

    @Test
    void aRejectedUpdateLeavesTheLocationAsItWas() throws Exception {
        String id = create(BODY).get("id").asText();
        send(put("/api/locations/" + id), editor(), BODY.replace("Colosseum", " "))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/locations/" + id).with(viewer()))
                .andExpect(jsonPath("$.translations.en.name").value("Colosseum"));
    }

    @Test
    void aTagIsSharedBetweenLocationsAndKeptWhenUnused() throws Exception {
        String tag = "shared-" + UUID.randomUUID().toString().substring(0, 8);
        String body = BODY.replace("[\" Roman \", \"arena\"]", "[\"" + tag.toUpperCase() + "\"]");
        String first = create(body).get("id").asText();
        String second = create(body).get("id").asText();

        assertThat(jdbc.queryForObject("SELECT count(*) FROM avarc.tag WHERE key = ?", Integer.class, tag))
                .isEqualTo(1);
        mockMvc.perform(get("/api/tags").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.key=='" + tag + "')].locations").value(2));

        for (String id : new String[] {first, second}) {
            mockMvc.perform(delete("/api/locations/" + id).with(editor()).with(csrf()))
                    .andExpect(status().isNoContent());
        }
        // unused, but kept: the tag stays listed with no locations
        mockMvc.perform(get("/api/tags").with(viewer()))
                .andExpect(jsonPath("$[?(@.key=='" + tag + "')].locations").value(0));
    }

    @Test
    void onlyAnAdminSetsLabelsAndTheyShowOnTheLocations() throws Exception {
        String tag = "labelled-" + UUID.randomUUID().toString().substring(0, 8);
        String id = create(BODY.replace("[\" Roman \", \"arena\"]", "[\"" + tag + "\"]"))
                .get("id")
                .asText();
        String labels = "{\"labels\": {\"en\": \"Roman\", \"de\": \"Römisch\"}}";

        send(put("/api/tags/" + tag), editor(), labels).andExpect(status().isForbidden());
        send(put("/api/tags/" + tag), viewer(), labels).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/tags/" + tag)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(labels))
                .andExpect(status().isUnauthorized());

        send(put("/api/tags/" + tag), as("admin-sub", "viewer", "editor", "admin"), labels)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value(tag))
                .andExpect(jsonPath("$.labels.de").value("Römisch"))
                .andExpect(jsonPath("$.locations").value(1));
        mockMvc.perform(get("/api/locations/" + id).with(viewer()))
                .andExpect(jsonPath("$.tags[0].labels.en").value("Roman"));

        // an editor re-using the tag, or sending labels on a location, does not change them
        send(put("/api/locations/" + id), editor(), BODY.replace("[\" Roman \", \"arena\"]", "[\"" + tag + "\"]"))
                .andExpect(jsonPath("$.tags[0].labels.de").value("Römisch"));

        // an empty map clears the labels
        send(put("/api/tags/" + tag), as("admin-sub", "admin"), "{\"labels\": {}}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.labels").isEmpty());
    }

    @Test
    void anAdminMayCreateATagWithLabelsAndBadInputIsRejected() throws Exception {
        OidcLoginRequestPostProcessor admin = as("admin-sub", "admin");
        send(put("/api/tags/Fresh-Tag"), admin, "{\"labels\": {\"de\": \"Neu\"}}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("fresh-tag"))
                .andExpect(jsonPath("$.locations").value(0));
        send(put("/api/tags/bad_key"), admin, "{\"labels\": {}}").andExpect(status().isBadRequest());
        send(put("/api/tags/ok"), admin, "{\"labels\": {\"fr\": \"x\"}}").andExpect(status().isBadRequest());
        send(put("/api/tags/ok"), admin, "{\"labels\": {\"en\": \" \"}}").andExpect(status().isBadRequest());
        send(put("/api/tags/ok"), admin, "{}").andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/tags")).andExpect(status().isUnauthorized());
    }

    @Test
    void referencesKeepTheirOrder() throws Exception {
        String body = BODY.substring(0, BODY.indexOf("\"references\""))
                + "\"references\": [{\"citations\": {\"en\": \"C\"}}, {\"citations\": {\"en\": \"A\"}},"
                + " {\"citations\": {\"en\": \"B\"}}]}";
        String id = create(body).get("id").asText();
        mockMvc.perform(get("/api/locations/" + id).with(viewer()))
                .andExpect(jsonPath("$.references[0].citations.en").value("C"))
                .andExpect(jsonPath("$.references[1].citations.en").value("A"))
                .andExpect(jsonPath("$.references[2].citations.en").value("B"));
    }

    @Test
    void aMalformedIdAnswers400AndAPageBeyondTheEndIsEmpty() throws Exception {
        mockMvc.perform(get("/api/locations/not-a-uuid").with(viewer())).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/locations?page=100000").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void sentIdentifierAndAuditFieldsAreIgnored() throws Exception {
        String forged = BODY.replaceFirst(
                "\\{", "{\"id\": \"00000000-0000-0000-0000-000000000001\", \"createdBy\": \"someone-else\", ");
        JsonNode created = create(forged);
        assertThat(created.get("id").asText()).isNotEqualTo("00000000-0000-0000-0000-000000000001");
        assertThat(created.get("createdBy").asText()).isEqualTo("editor-sub");
    }

    @Test
    void writesNeedTheCsrfToken() throws Exception {
        mockMvc.perform(post("/api/locations")
                        .with(editor())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isForbidden());
    }
}

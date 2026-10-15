package org.avarc.server.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.avarc.server.TestDatabase;
import org.avarc.server.auth.LoginSucceeded;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OidcLoginRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestDatabase.class)
@SpringBootTest
@AutoConfigureMockMvc
class UserTests {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ApplicationEventPublisher events;
    @Autowired
    private JdbcTemplate jdbc;

    private static OidcLoginRequestPostProcessor login(String subject) {
        return oidcLogin().idToken(token -> token.subject(subject).claim("preferred_username", subject + "@avarc.invalid")
                .claim("email", subject + "@avarc.invalid").claim("given_name", "Ada").claim("family_name", "Lovelace")
                .claim("name", "Ada Lovelace"));
    }

    private int count(String subject) {
        return jdbc.queryForObject("SELECT count(*) FROM avarc.app_user WHERE subject = ?", Integer.class, subject);
    }

    @Test
    void meNeedsALogin() throws Exception {
        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/users/me").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void theFirstLoginCreatesOneUserAndLaterOnesRefreshIt() {
        String sub = "sub-" + UUID.randomUUID();
        events.publishEvent(new LoginSucceeded(sub, "old", "old@avarc.invalid", "A", "B", "A B"));
        events.publishEvent(new LoginSucceeded(sub, "new", "new@avarc.invalid", "Ada", "Lovelace", "Ada Lovelace"));
        assertThat(count(sub)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT username FROM avarc.app_user WHERE subject = ?", String.class, sub))
                .isEqualTo("new");
    }

    @Test
    void simultaneousFirstLoginsEndWithOneUser() throws Exception {
        String sub = "sub-" + UUID.randomUUID();
        Callable<Object> task = () -> {
            events.publishEvent(new LoginSucceeded(sub, "u", null, null, null, null));
            return null;
        };
        try (var pool = Executors.newFixedThreadPool(4)) {
            for (var future : pool.invokeAll(List.of(task, task, task, task))) {
                future.get();
            }
        }
        assertThat(count(sub)).isEqualTo(1);
    }

    @Test
    void meCreatesAMissingUserAndHidesTheSubject() throws Exception {
        String sub = "sub-" + UUID.randomUUID();
        mockMvc.perform(get("/api/users/me").with(login(sub)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.subject").doesNotExist())
                .andExpect(jsonPath("$.displayName").value("Ada Lovelace"))
                .andExpect(jsonPath("$.preferences").isEmpty());
        assertThat(count(sub)).isEqualTo(1);
    }

    @Test
    void preferencesAreMergedAndPerUser() throws Exception {
        String sub = "sub-" + UUID.randomUUID();
        String other = "sub-" + UUID.randomUUID();
        mockMvc.perform(patch("/api/users/me").with(login(sub)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"preferences\":{\"appearance\":\"dark\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferences.appearance").value("dark"));
        mockMvc.perform(get("/api/users/me").with(login(sub)))
                .andExpect(jsonPath("$.preferences.appearance").value("dark"));
        mockMvc.perform(get("/api/users/me").with(login(other)))
                .andExpect(jsonPath("$.preferences.appearance").doesNotExist());
    }

    @Test
    void invalidPreferencesAreRejected() throws Exception {
        for (String body : List.of("{\"preferences\":{\"appearance\":\"purple\"}}",
                "{\"preferences\":{\"language\":\"de\"}}")) {
            mockMvc.perform(patch("/api/users/me").with(login("sub-x")).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void patchNeedsTheCsrfToken() throws Exception {
        mockMvc.perform(patch("/api/users/me").with(login("sub-x")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"preferences\":{\"appearance\":\"dark\"}}"))
                .andExpect(status().isForbidden());
    }
}

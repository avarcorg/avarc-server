package org.avarc.server;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

/** The logs are JSON lines with the shared fields, and changes are audited. See spec/SPEC-observability.md. */
@Import(TestDatabase.class)
@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class LogTests {

    private static final String BODY = """
        {"position": {"kind": "point", "latitude": 1.0, "longitude": 2.0}, "confidenceLevel": 3,
         "translations": {"en": {"name": "Audited", "description": "Seen in the audit log."}}}
        """;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void creatingALocationWritesAnAuditLineWithTheRequestAndTheUser(CapturedOutput output) throws Exception {
        mockMvc.perform(post("/api/locations")
                        .with(csrf())
                        .with(oidcLogin()
                                .idToken(token -> token.subject("editor-sub"))
                                .authorities(new SimpleGrantedAuthority("ROLE_editor")))
                        .header("X-Request-Id", "req-audit-0001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BODY))
                .andExpect(status().isCreated());

        String line = output.getAll()
                .lines()
                .filter(l -> l.contains("\"action\":\"location.created\""))
                .findFirst()
                .orElseThrow();
        assertThat(line)
                .contains("\"service\":\"backend\"")
                .contains("\"level\":\"INFO\"")
                .contains("\"request_id\":\"req-audit-0001\"")
                .contains("\"user_id\":\"editor-sub\"")
                .contains("\"audit\":true")
                .contains("\"entity_type\":\"location\"")
                .contains("\"entity_id\":\"")
                .contains("\"timestamp\":\"");
    }
}

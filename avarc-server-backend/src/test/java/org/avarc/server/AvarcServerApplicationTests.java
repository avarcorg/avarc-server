package org.avarc.server;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AvarcServerApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void helloReturnsGreeting() throws Exception {
        mockMvc.perform(get("/api/hello").with(oidcLogin()))
                .andExpect(status().isOk())
                .andExpect(content().string("Hello, avarc!"));
    }

    @Test
    void helloNeedsALogin() throws Exception {
        mockMvc.perform(get("/api/hello")).andExpect(status().isUnauthorized());
    }

    @Test
    void healthIsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void otherActuatorEndpointsAreNotExposed() throws Exception {
        mockMvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
    }

    @Test
    void theApiDescriptionIsNotServed() throws Exception {
        mockMvc.perform(get("/api/docs/openapi.json")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/docs/openapi.json").with(oidcLogin())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/docs")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/swagger-ui/index.html")).andExpect(status().isUnauthorized());
    }
}

package org.avarc.server;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestDatabase.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class DevProfileActuatorTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void allActuatorEndpointsAreExposed() throws Exception {
        mockMvc.perform(get("/actuator/env")).andExpect(status().isOk());
        mockMvc.perform(get("/actuator/beans")).andExpect(status().isOk());
    }
}

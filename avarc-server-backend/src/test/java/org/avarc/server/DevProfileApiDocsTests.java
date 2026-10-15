package org.avarc.server;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
class DevProfileApiDocsTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void theDescriptionIsOpenAndListsTheEndpoints() throws Exception {
        mockMvc.perform(get("/api/docs/openapi.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("avarc-server API"))
                .andExpect(jsonPath("$.paths['/api/hello']").exists())
                .andExpect(jsonPath("$.paths['/api/auth/me']").exists());
    }

    @Test
    void swaggerUiIsOpen() throws Exception {
        mockMvc.perform(get("/api/docs")).andExpect(status().is3xxRedirection());
        mockMvc.perform(get("/api/swagger-ui/index.html")).andExpect(status().isOk());
        mockMvc.perform(get("/api/docs/openapi.json/swagger-config")).andExpect(status().isOk());
    }

    @Test
    void theEndpointsStayProtected() throws Exception {
        mockMvc.perform(get("/api/hello")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}

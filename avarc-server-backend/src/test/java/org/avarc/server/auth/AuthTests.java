package org.avarc.server.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@Import(org.avarc.server.TestDatabase.class)
@SpringBootTest(properties = {"avarc.auth.public-origin=https://avarc.example", "avarc.auth.client-secret=test-secret"})
@AutoConfigureMockMvc
class AuthTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void meNeedsALogin() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginRedirectsToKeycloakWithPkce() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/login/keycloak"))
                .andExpect(status().isFound())
                .andReturn();
        String location = result.getResponse().getHeader("Location");
        assertThat(location)
                .startsWith("https://avarc.example/auth/realms/avarc/protocol/openid-connect/auth?")
                .contains(
                        "response_type=code",
                        "client_id=avarc-web",
                        "code_challenge_method=S256",
                        "code_challenge=",
                        "redirect_uri=https://avarc.example/api/auth/callback");
    }

    @Test
    void meReportsTheUserAndTheRoles() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .with(oidcLogin()
                                .idToken(token -> token.claim("preferred_username", "ada@avarc.invalid")
                                        .claim("name", "Ada")
                                        .claim("email", "ada@avarc.invalid"))
                                .authorities(
                                        new SimpleGrantedAuthority("ROLE_viewer"),
                                        new SimpleGrantedAuthority("ROLE_editor"))))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.username").value("ada@avarc.invalid"))
                .andExpect(jsonPath("$.name").value("Ada"))
                .andExpect(jsonPath("$.roles[0]").value("viewer"))
                .andExpect(jsonPath("$.roles[1]").value("editor"))
                .andExpect(jsonPath("$.roles.length()").value(2))
                .andExpect(jsonPath("$.csrfToken").isNotEmpty());
    }

    @Test
    void logoutNeedsTheCsrfToken() throws Exception {
        mockMvc.perform(post("/api/auth/logout").with(oidcLogin())).andExpect(status().isForbidden());
    }

    @Test
    void logoutEndsTheKeycloakSessionAndReturnsToTheLoggedOutPage() throws Exception {
        MvcResult result = mockMvc.perform(
                        post("/api/auth/logout").with(oidcLogin()).with(csrf()))
                .andExpect(status().isFound())
                .andReturn();
        assertThat(result.getResponse().getHeader("Location"))
                .startsWith("https://avarc.example/auth/realms/avarc/protocol/openid-connect/logout?")
                .contains(
                        "client_id=avarc-web",
                        "id_token_hint=",
                        "post_logout_redirect_uri=https://avarc.example/logged-out");
    }

    @Test
    void rolesComeFromTheRealmRolesOfTheAccessToken() throws Exception {
        assertThat(Roles.fromAccessToken(token(Map.of("roles", List.of("default-roles-avarc", "editor")))))
                .containsExactly("viewer", "editor");
        assertThat(Roles.fromAccessToken(token(Map.of("roles", List.of("admin", "editor", "viewer")))))
                .containsExactly("viewer", "editor", "admin");
        assertThat(Roles.fromAccessToken(token(Map.of()))).containsExactly("viewer");
        assertThat(Roles.fromAccessToken("not a token")).containsExactly("viewer");
    }

    private static String token(Map<String, Object> realmAccess) throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                new JWTClaimsSet.Builder().claim("realm_access", realmAccess).build());
        jwt.sign(new MACSigner("0123456789abcdef0123456789abcdef"));
        return jwt.serialize();
    }
}

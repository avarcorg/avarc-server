package org.avarc.server.auth;

import static org.springframework.security.config.Customizer.withDefaults;

import java.util.LinkedHashSet;
import java.util.Set;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.web.util.UriComponentsBuilder;

/** The backend as the OIDC client of Keycloak. See spec/SPEC-auth.md. */
@Configuration
@EnableConfigurationProperties(AuthProperties.class)
class SecurityConfig {

    private static final String REGISTRATION_ID = "keycloak";
    private static final String OIDC = "/protocol/openid-connect";

    /** The realm's endpoints come from the configuration, not from discovery. */
    @Bean
    ClientRegistrationRepository clientRegistrationRepository(AuthProperties auth) {
        ClientRegistration registration = ClientRegistration.withRegistrationId(REGISTRATION_ID)
                .clientId(auth.clientId())
                .clientSecret(auth.clientSecret())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(auth.publicOrigin() + "/api/auth/callback")
                .scope("openid", "profile", "email")
                .issuerUri(auth.keycloakUrl())
                .authorizationUri(auth.keycloakUrl() + OIDC + "/auth")
                .tokenUri(auth.keycloakInternalUrl() + OIDC + "/token")
                .jwkSetUri(auth.keycloakInternalUrl() + OIDC + "/certs")
                .userNameAttributeName("preferred_username")
                .clientName("Keycloak")
                .build();
        return new InMemoryClientRegistrationRepository(registration);
    }

    /** Adds the application roles of the access token as ROLE_ authorities. */
    @Bean
    OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        OidcUserService delegate = new OidcUserService();
        return request -> {
            OidcUser user = delegate.loadUser(request);
            Set<GrantedAuthority> authorities = new LinkedHashSet<>(user.getAuthorities());
            for (String role : Roles.fromAccessToken(request.getAccessToken().getTokenValue())) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
            }
            return new DefaultOidcUser(authorities, user.getIdToken(), user.getUserInfo(), "preferred_username");
        };
    }

    /** Ends the Keycloak session too, then returns to the logged-out page. */
    @Bean
    LogoutSuccessHandler keycloakLogoutSuccessHandler(AuthProperties auth) {
        return (HttpServletRequest request, HttpServletResponse response, Authentication authentication) -> {
            UriComponentsBuilder target = UriComponentsBuilder.fromUriString(auth.keycloakUrl() + OIDC + "/logout")
                    .queryParam("client_id", auth.clientId())
                    .queryParam("post_logout_redirect_uri", auth.publicOrigin() + "/logged-out");
            if (authentication != null && authentication.getPrincipal() instanceof OidcUser user) {
                target.queryParam("id_token_hint", user.getIdToken().getTokenValue());
            }
            response.sendRedirect(target.build().encode().toUriString());
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AuthProperties auth,
            @Value("${springdoc.swagger-ui.enabled:false}") boolean apiDocsOpen,
            ClientRegistrationRepository registrations, OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService,
            LogoutSuccessHandler logoutSuccessHandler) throws Exception {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(registrations, "/api/auth/login");
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());

        http
                .authorizeHttpRequests(requests -> {
                    // which actuator endpoints exist is decided by the profile
                    requests.requestMatchers("/actuator/**").permitAll();
                    requests.requestMatchers("/api/auth/login/**", "/api/auth/callback").permitAll();
                    // the API description and Swagger UI exist only where a profile enables them
                    if (apiDocsOpen) {
                        requests.requestMatchers("/api/docs", "/api/docs/**", "/api/swagger-ui/**").permitAll();
                    }
                    requests.anyRequest().authenticated();
                })
                // 401 instead of a redirect to a login page: the login page is the frontend's
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .oauth2Login(login -> login
                        .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver))
                        .redirectionEndpoint(endpoint -> endpoint.baseUri("/api/auth/callback"))
                        .userInfoEndpoint(endpoint -> endpoint.oidcUserService(oidcUserService))
                        .defaultSuccessUrl(auth.publicOrigin() + "/", true)
                        .failureUrl(auth.publicOrigin() + "/login?error"))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler(logoutSuccessHandler)
                        .deleteCookies("AVARC_SESSION"))
                .csrf(withDefaults());
        return http.build();
    }
}

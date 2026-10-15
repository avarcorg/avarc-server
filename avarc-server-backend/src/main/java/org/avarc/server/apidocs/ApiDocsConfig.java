package org.avarc.server;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The description of the API, served where springdoc is enabled (dev, stage). */
@Configuration
@ConditionalOnProperty(name = "springdoc.api-docs.enabled", havingValue = "true")
class ApiDocsConfig {

    static final String CSRF = "csrf";

    @Bean
    OpenAPI avarcOpenApi(@Value("${avarc.api.version}") String version) {
        return new OpenAPI()
                .info(new Info()
                        .title("avarc-server API")
                        .version(version)
                        .description("""
                                The API of avarc-server under `/api/`.

                                Authentication is a login at Keycloak through the backend, which keeps \
                                the session in the cookie `AVARC_SESSION`: log in on the same origin \
                                (`/api/auth/login/keycloak`), then calls from this page carry the cookie. \
                                Requests that change data also need the CSRF token, which \
                                `GET /api/auth/me` reports, in the header `X-CSRF-TOKEN` (authorize \
                                with it above). Without a login the API answers 401. \
                                This description and the page are served in the dev and stage \
                                environments only."""))
                .components(new Components().addSecuritySchemes(CSRF, new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name("X-CSRF-TOKEN")
                        .description("The csrfToken of GET /api/auth/me.")));
    }
}

package org.avarc.server.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .addServersItem(new Server()
                .url("/")
                .description("Current server"))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName,
                    new SecurityScheme()
                        .name("Authorization")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT"))
                .addParameters("languageHeader", new Parameter()
                    .in("header")
                    .name("X-Language")
                    .description("Language code for response messages (e.g., 'en', 'de'). If not provided, falls back to Accept-Language header or default language (en).")
                    .schema(new io.swagger.v3.oas.models.media.StringSchema()
                        .addEnumItem("en")
                        .addEnumItem("de")
                        ._default("en"))))
            .info(new Info()
                .title("avArc Backend API")
                .version("v0.1.0")
                .description("Dynamically generated OpenAPI spec from running backend. All responses support internationalization (i18n) through the X-Language header."));
    }
}

package org.avarc.server.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Where the realm is and who the backend is as its client. The public URL
 * is what the browser and the tokens' issuer use; the internal URL is what
 * the backend itself calls. See spec/SPEC-auth.md.
 */
@ConfigurationProperties("avarc.auth")
public record AuthProperties(
        String publicOrigin,
        String keycloakUrl,
        String keycloakInternalUrl,
        String clientId,
        String clientSecret) {
}

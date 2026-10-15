package org.avarc.server.auth;

/**
 * Published after a successful login at Keycloak. The claims are those of the
 * ID token; any of them but the subject may be missing.
 */
public record LoginSucceeded(
        String subject, String username, String email, String firstName, String lastName, String displayName) {}

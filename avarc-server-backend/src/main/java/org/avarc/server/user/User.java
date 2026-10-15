package org.avarc.server.user;

import java.util.Map;
import java.util.UUID;

/** A user of the application as the API shows it; the Keycloak subject stays inside. */
public record User(
        UUID id,
        String username,
        String email,
        String firstName,
        String lastName,
        String displayName,
        Map<String, Object> preferences) {}

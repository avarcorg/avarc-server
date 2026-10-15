package org.avarc.server.location;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** A location as the API shows it. {@code createdBy} and {@code updatedBy} are Keycloak subjects. */
public record Location(
        UUID id,
        Position position,
        int confidenceLevel,
        Instant periodStart,
        Instant periodEnd,
        Map<String, Translation> translations,
        List<Tag> tags,
        List<Reference> references,
        Instant createdAt,
        Instant updatedAt,
        String createdBy,
        String updatedBy) {}

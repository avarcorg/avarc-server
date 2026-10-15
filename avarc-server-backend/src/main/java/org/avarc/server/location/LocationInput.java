package org.avarc.server.location;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** The content of a location as a client sends it; identifier and audit fields are the system's. */
public record LocationInput(
        Position position,
        Integer confidenceLevel,
        Instant periodStart,
        Instant periodEnd,
        Map<String, Translation> translations,
        List<Tag> tags,
        List<Reference> references) {}

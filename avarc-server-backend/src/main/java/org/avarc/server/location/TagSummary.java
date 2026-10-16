package org.avarc.server.location;

import java.util.Map;

/** A tag with the number of locations that carry it. */
public record TagSummary(String key, Map<String, String> labels, long locations) {}

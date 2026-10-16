package org.avarc.server.location;

import java.util.Map;

/** A tag of a location as the API shows it; the labels are per language and may be empty. */
public record Tag(String key, Map<String, String> labels) {}

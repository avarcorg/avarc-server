package org.avarc.server.location;

import java.util.Map;

/** A source of a location, with a citation per language. */
public record Reference(String url, Map<String, String> citations) {}

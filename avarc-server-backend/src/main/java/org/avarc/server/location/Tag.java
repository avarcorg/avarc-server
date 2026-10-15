package org.avarc.server.location;

import java.util.Map;

/** A tag of a location. In a request, no labels keeps the labels the tag already has. */
public record Tag(String key, Map<String, String> labels) {}

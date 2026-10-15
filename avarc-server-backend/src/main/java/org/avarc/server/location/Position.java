package org.avarc.server.location;

/** Where a location is. The only kind so far is {@code point}, in WGS 84 degrees. */
public record Position(String kind, Double latitude, Double longitude) {}

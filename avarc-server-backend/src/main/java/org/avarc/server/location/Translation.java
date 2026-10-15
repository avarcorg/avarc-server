package org.avarc.server.location;

/** The wording of a location in one language; the confidence level defaults to 3. */
public record Translation(String name, String description, String periodLabel, Integer confidenceLevel) {}

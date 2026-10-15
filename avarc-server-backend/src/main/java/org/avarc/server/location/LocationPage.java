package org.avarc.server.location;

import java.util.List;

/** One page of locations; {@code page} counts from 0. */
public record LocationPage(List<Location> items, int page, int size, long total) {}

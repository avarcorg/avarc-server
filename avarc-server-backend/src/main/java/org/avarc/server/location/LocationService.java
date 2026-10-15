package org.avarc.server.location;

import java.util.UUID;

/** Create, read, update, delete and list of locations. {@code actor} is the Keycloak subject. */
public interface LocationService {

    int MAX_PAGE_SIZE = 100;

    LocationPage list(int page, int size);

    Location get(UUID id);

    Location create(LocationInput input, String actor);

    Location update(UUID id, LocationInput input, String actor);

    void delete(UUID id);
}

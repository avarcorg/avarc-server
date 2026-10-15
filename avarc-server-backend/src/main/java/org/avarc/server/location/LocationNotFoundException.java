package org.avarc.server.location;

import java.util.UUID;

public class LocationNotFoundException extends RuntimeException {

    public LocationNotFoundException(UUID id) {
        super("No location " + id);
    }
}

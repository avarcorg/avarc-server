package org.avarc.server.location;

/** A request that breaks a rule of the locations spec. */
public class InvalidLocationException extends RuntimeException {

    public InvalidLocationException(String message) {
        super(message);
    }
}

package org.avarc.server.user;

/** Thrown for a preference that does not exist or has an invalid value. */
public class InvalidPreferencesException extends RuntimeException {

    public InvalidPreferencesException(String message) {
        super(message);
    }
}

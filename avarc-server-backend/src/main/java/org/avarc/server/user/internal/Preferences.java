package org.avarc.server.user.internal;

import java.util.List;
import java.util.Map;
import org.avarc.server.user.InvalidPreferencesException;

/** The preferences that exist and the values they accept. */
final class Preferences {

    static final String APPEARANCE = "appearance";
    private static final List<String> APPEARANCES = List.of("light", "dark", "system");

    private Preferences() {}

    static void validate(Map<String, Object> changes) {
        for (Map.Entry<String, Object> change : changes.entrySet()) {
            if (!APPEARANCE.equals(change.getKey())) {
                throw new InvalidPreferencesException("Unknown preference: " + change.getKey());
            }
            if (!(change.getValue() instanceof String value) || !APPEARANCES.contains(value)) {
                throw new InvalidPreferencesException("appearance must be one of " + APPEARANCES);
            }
        }
    }
}

package org.avarc.server.location.internal;

import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.avarc.server.location.InvalidLocationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** The rules for tag keys and labels, see spec/SPEC-locations.md. */
@Component
class TagRules {

    private static final Pattern KEY = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final int KEY_MAX = 64;

    private final Set<String> languages;

    TagRules(@Value("${avarc.locations.languages:en,de}") Set<String> languages) {
        this.languages = languages;
    }

    /** Trimmed and lower-cased; rejects a key that is not 1 to 64 characters of a-z, 0-9 and single hyphens. */
    String key(String raw) {
        String key = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
        if (key.length() > KEY_MAX || !KEY.matcher(key).matches()) {
            throw new InvalidLocationException(
                    "a tag key is 1 to " + KEY_MAX + " characters of a-z, 0-9 and single hyphens");
        }
        return key;
    }

    /** Labels in supported languages, none empty; an empty map is allowed. */
    Map<String, String> labels(Map<String, String> labels) {
        if (labels == null) {
            throw new InvalidLocationException("labels are required, an empty map clears them");
        }
        labels.forEach((language, text) -> {
            if (!languages.contains(language)) {
                throw new InvalidLocationException("language " + language + " is not supported");
            }
            if (text == null || text.isBlank()) {
                throw new InvalidLocationException("a tag label must not be empty");
            }
        });
        return labels;
    }
}

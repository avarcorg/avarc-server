package org.avarc.server.user;

import java.util.Map;

/** The API of the module {@code user}. See spec/SPEC-users.md. */
public interface UserService {

    /** The user of the subject, created from the claims if there is none yet. */
    User currentUser(String subject, UserClaims claims);

    /** Merges the given preferences into the stored ones; rejects unknown keys and invalid values. */
    User updatePreferences(String subject, UserClaims claims, Map<String, Object> changes);

    /** The profile claims of the ID token; any may be missing. */
    record UserClaims(String username, String email, String firstName, String lastName, String displayName) {
    }
}

package org.avarc.server.auth;

import com.nimbusds.jwt.JWTParser;
import java.text.ParseException;
import java.util.List;
import java.util.Map;

/** The application roles in the realm roles of an access token. */
final class Roles {

    static final List<String> KNOWN = List.of("viewer", "editor", "admin");

    private Roles() {
    }

    /**
     * The known roles named in {@code realm_access.roles} of the token. The
     * token comes straight from the token endpoint over the back channel, so
     * its signature is not checked again here. Every user is a viewer.
     */
    static List<String> fromAccessToken(String token) {
        List<?> named = List.of();
        try {
            Map<String, Object> access = JWTParser.parse(token).getJWTClaimsSet().getJSONObjectClaim("realm_access");
            if (access != null && access.get("roles") instanceof List<?> roles) {
                named = roles;
            }
        } catch (ParseException e) {
            // an unreadable token grants nothing beyond viewer
        }
        List<?> granted = named;
        return KNOWN.stream().filter(role -> role.equals("viewer") || granted.contains(role)).toList();
    }
}

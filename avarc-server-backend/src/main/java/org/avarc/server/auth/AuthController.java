package org.avarc.server.auth;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AuthController {

    /** The logged-in user; an unauthenticated request never gets here (401). */
    @GetMapping("/api/auth/me")
    ResponseEntity<Me> me(@AuthenticationPrincipal OidcUser user, CsrfToken csrf) {
        List<String> roles = Roles.KNOWN.stream()
                .filter(role -> user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role)))
                .toList();
        Me me = new Me(user.getPreferredUsername(), user.getFullName(), user.getEmail(), roles, csrf.getToken());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(me);
    }

    record Me(String username, String name, String email, List<String> roles, String csrfToken) {
    }
}

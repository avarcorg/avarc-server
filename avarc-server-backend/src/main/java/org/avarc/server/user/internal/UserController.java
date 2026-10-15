package org.avarc.server.user.internal;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.avarc.server.user.InvalidPreferencesException;
import org.avarc.server.user.User;
import org.avarc.server.user.UserService;
import org.avarc.server.user.UserService.UserClaims;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "users", description = "The logged-in user's own record and preferences")
class UserController {

    private final UserService users;

    UserController(UserService users) {
        this.users = users;
    }

    @Operation(summary = "The record of the logged-in user")
    @GetMapping("/api/users/me")
    ResponseEntity<User> me(@AuthenticationPrincipal OidcUser principal) {
        return noStore(users.currentUser(principal.getSubject(), claims(principal)));
    }

    @Operation(summary = "Merges the given preferences into those of the logged-in user")
    @PatchMapping("/api/users/me")
    ResponseEntity<User> update(@AuthenticationPrincipal OidcUser principal, @RequestBody PreferencesPatch patch) {
        Map<String, Object> changes = patch.preferences() == null ? Map.of() : patch.preferences();
        return noStore(users.updatePreferences(principal.getSubject(), claims(principal), changes));
    }

    @ExceptionHandler(InvalidPreferencesException.class)
    ProblemDetail invalid(InvalidPreferencesException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    private static UserClaims claims(OidcUser user) {
        return new UserClaims(
                user.getPreferredUsername(),
                user.getEmail(),
                user.getGivenName(),
                user.getFamilyName(),
                user.getFullName());
    }

    private static ResponseEntity<User> noStore(User user) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(user);
    }

    record PreferencesPatch(Map<String, Object> preferences) {}
}

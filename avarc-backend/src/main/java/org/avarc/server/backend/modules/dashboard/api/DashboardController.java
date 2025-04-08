package org.avarc.server.backend.modules.dashboard.api;

import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.avarc.server.backend.modules.authentication.api.AuthRequest;
import org.avarc.server.backend.modules.authentication.api.AuthResponse;
import org.avarc.server.backend.modules.authentication.internal.AuthService;
import org.avarc.server.backend.modules.security.JwtService;
import org.avarc.server.backend.modules.user.api.Role;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rest/v0.1.0/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dashboard", description = "Endpoints for Dashboards, e.g. user management and so on")
public class DashboardController {

    private final JwtService jwtService;

    @Operation(
        summary = "Get current authenticated user",
        description = "Returns the current user if authenticated and token is valid.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Current user info",
                content = @Content(mediaType = "application/json",
                                   examples = @ExampleObject(
                                       value = "{\"username\": \"admin\", \"roles\": [\"ADMIN\"], \"token\": null}"
                                   )
                )
            ),
            @ApiResponse(
                responseCode = "401",
                description = "Unauthorized - no valid JWT token"
            )
        }
    )
    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication authentication) {
        log.debug("→ Entering me()");

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            String username = authentication.getName();
            log.debug("  current username: {}", username);
            List<Role> roles = authentication.getAuthorities().stream()
                .map(granted -> Role.valueOf(granted.getAuthority().replace("ROLE_", "")))
                .toList();

            log.debug("  current roles: {}", roles);

            UserDto dto = new UserDto(username, null, roles);
            log.debug("  current user: {}", dto);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Failed to resolve user from authentication", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}

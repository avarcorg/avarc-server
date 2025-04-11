package org.avarc.server.backend.modules.user.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.avarc.server.backend.modules.security.JwtService;
import org.avarc.server.backend.modules.user.internal.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/rest/v0.1.0/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private final JwtService jwtService;

    @Operation(
        summary = "Get current user",
        description = "Returns the current authenticated user's details.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "User details retrieved successfully",
                content = @Content(mediaType = "application/json",
                                   examples = @ExampleObject(
                                       value = "{\"email\": \"user@example.com\", \"roles\": [\"USER\"], \"uuid\": \"123e4567-e89b-12d3-a456-426614174000\"}"
                                   )
                )
            ),
            @ApiResponse(
                responseCode = "401",
                description = "Unauthorized"
            )
        }
    )
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        log.debug("→ Entering getCurrentUser()");
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authentication.getCredentials().toString();
        String email = jwtService.extractUsername(token);

        UserDto userDto = new UserDto(email, null);

        userDto.setRoles(jwtService.extractRoles(token));
        userDto.setUuid(jwtService.extractUuid(token));

        return ResponseEntity.ok(userDto);
    }
}

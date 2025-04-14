package org.avarc.server.backend.modules.user.api;

import java.util.List;
import java.util.UUID;

import org.avarc.server.backend.modules.security.JwtService;
import org.avarc.server.backend.modules.user.internal.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/rest/v0.1.0/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Users", description = "User information and management")
public class UserController {

    private final JwtService jwtService;
    private final UserService userService;

    @Operation(
        summary = "Get current authenticated user",
        description = "Returns the current user if authenticated and token is valid. All error messages are internationalized based on the X-Language header.",
        security = @SecurityRequirement(name = "bearerAuth"),
        parameters = {
            @io.swagger.v3.oas.annotations.Parameter(
                name = HttpHeaders.AUTHORIZATION,
                description = "Bearer token",
                required = true,
                example = "Bearer eyJhbGciOi..."
            ),
            @io.swagger.v3.oas.annotations.Parameter(
                name = "X-Language",
                description = "Language preference for error messages",
                example = "en",
                required = false
            ),
            @io.swagger.v3.oas.annotations.Parameter(
                name = HttpHeaders.ACCEPT_LANGUAGE,
                description = "Language preference for error messages",
                example = "en",
                required = false
            )
        },
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Current user info",
                content = @Content(mediaType = "application/json",
                                   examples = @ExampleObject(
                                       value = "{\"username\": \"admin\", \"roles\": [\"ADMIN\"], \"uuid\": \"123e4567-e89b-12d3-a456-426614174000\", \"token\": null}"
                                   )
                )
            ),
            @ApiResponse(
                responseCode = "401",
                description = "Unauthorized - no valid JWT token",
                content = @Content(examples = @ExampleObject(
                    value = "{\"errorCode\":\"UNAUTHORIZED\",\"errorMessage\":\"Authentication required\"}"
                ))
            )
        }
    )
    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader, Authentication authentication) {
        log.debug("→ Entering me()");

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // TODO: the "me" endpoint should return a UserResponse object, not a UserDto

        try {
            String token = authHeader != null && authHeader.startsWith("Bearer ")
                ? authHeader.substring(7)
                : null;

            if (token == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }

            String username = authentication.getName();
            UserDto dto = new UserDto(username, null);

            List<Role> roles = jwtService.extractRoles(token);
            log.debug("  current roles: {}", roles);
            UUID uuid = jwtService.extractUuid(token);
            log.debug("  current uuid: {}", uuid);

            dto.setRoles(roles);
            dto.setUuid(uuid);

            log.debug("  current user: {}", dto);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Failed to resolve user from authentication", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @Operation(
        summary = "Update user details",
        description = "Updates the user details for the specified UUID. All error messages are internationalized based on the X-Language header.",
        security = @SecurityRequirement(name = "bearerAuth"),
        parameters = {
            @io.swagger.v3.oas.annotations.Parameter(
                name = "uuid",
                description = "User UUID",
                example = "123e4567-e89b-12d3-a456-426614174000",
                required = true
            ),
            @io.swagger.v3.oas.annotations.Parameter(
                name = HttpHeaders.AUTHORIZATION,
                description = "Bearer token",
                required = true,
                example = "Bearer eyJhbGciOi..."
            ),
            @io.swagger.v3.oas.annotations.Parameter(
                name = "X-Language",
                description = "Language preference for error messages",
                example = "en",
                required = false
            ),
            @io.swagger.v3.oas.annotations.Parameter(
                name = HttpHeaders.ACCEPT_LANGUAGE,
                description = "Language preference for error messages",
                example = "en",
                required = false
            )
        },
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User update data",
            required = true,
            content = @Content(examples = @ExampleObject(
                value = "{\"username\":\"jane.doe\",\"email\":\"jane.doe@example.com\",\"firstName\":\"Jane\",\"lastName\":\"Doe\"}"
            ))
        ),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "User updated successfully",
                content = @Content(examples = @ExampleObject(
                    value = "{\"user\":{\"username\":\"jane.doe\",\"email\":\"jane.doe@example.com\",\"firstName\":\"Jane\",\"lastName\":\"Doe\",\"roles\":[\"USER\"]},\"token\":\"eyJhbGciOiJIUzI1NiIs...\"}"
                ))
            ),
            @ApiResponse(
                responseCode = "404",
                description = "User not found",
                content = @Content(examples = @ExampleObject(
                    value = "{\"errorCode\":\"USER_NOT_FOUND\",\"errorMessage\":\"User not found\"}"
                ))
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Invalid request",
                content = @Content(examples = @ExampleObject(
                    value = "{\"errorCode\":\"UPDATE_ERROR\",\"errorMessage\":\"Invalid user data\"}"
                ))
            )
        }
    )
    @PutMapping("/{uuid}")
    public ResponseEntity<UserResponse> updateUser(
        @PathVariable UUID uuid,
        @RequestBody UserDto updateDto,
        @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        log.debug("→ Entering updateUser()");
        try {
            UserDto updatedUser = userService.updateUser(uuid, updateDto);

            // Always generate a new token
            String newToken = jwtService.generateToken(
                updatedUser.getUsername(),
                updatedUser.getUuid(),
                updatedUser.getRoles()
            );

            return ResponseEntity.ok(new UserResponse(updatedUser, newToken));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new UserResponse("UPDATE_ERROR", e.getMessage()));
        }
    }
}

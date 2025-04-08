package org.avarc.server.backend.modules.authentication.api;

import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequestMapping("/rest/v0.1.0/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Endpoints for user login and registration")
public class AuthController {

    private final AuthService authService;

    private final JwtService jwtService;

    @PostMapping("/register")
    @Operation(
        summary = "Register new user",
        description = "Creates a new user if the username is not already taken.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User credentials for registration",
            required = true,
            content = @Content(examples = @ExampleObject(
                name = "Registration Request Example",
                summary = "Example user registration input",
                value = "{ \"username\": \"newuser\", \"password\": \"securepass\" }"
            ))
        ),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Successful registration",
                content = @Content(examples = @ExampleObject(
                    name = "Success",
                    value = "{\"token\":\"eyJhbGciOiJIUzI1NiIs...\",\"user\":{\"username\":\"new.user\"},\"errorCode\":null,\"errorMessage\":null}"
                ))
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Registration error",
                content = @Content(examples = @ExampleObject(
                    name = "Username Already Exists",
                    value = "{ \"user\": null, \"errorCode\": \"REGISTER_ERROR\", \"errorMessage\": \"User already exists: newuser\" }"
                ))
            )
        }
    )
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        log.debug("→ Entering register()");
        try {
            UserDto user = authService.register(request);
            String token = jwtService.generateToken(user.getUsername(), user.getRoles());
            return ResponseEntity.ok(new AuthResponse(user, token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse("LOGIN_ERROR", e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Operation(
        summary = "Login existing user",
        description = "Authenticates a user and returns user information if credentials are valid.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User login credentials",
            required = true,
            content = @Content(examples = @ExampleObject(
                name = "Login Request Example",
                value = "{ \"username\": \"admin\", \"password\": \"admin123\" }"
            ))
        ),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Successful login",
                content = @Content(examples = @ExampleObject(
                    value = "{\"token\":\"eyJhbGciOiJIUzI1NiIs...\",\"user\":{\"username\":\"jane.doe\"},\"errorCode\":null,\"errorMessage\":null}"
                ))
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Invalid credentials",
                content = @Content(examples = @ExampleObject(
                    value = "{ \"user\": null, \"errorCode\": \"LOGIN_ERROR\", \"errorMessage\": \"Invalid username or password\" }"
                ))
            )
        }
    )
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        log.debug("→ Entering login()");
        try {
            UserDto user = authService.authenticate(request);
            String token = jwtService.generateToken(user.getUsername(), user.getRoles());
            return ResponseEntity.ok(new AuthResponse(user, token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse("LOGIN_ERROR", e.getMessage()));
        }
    }

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

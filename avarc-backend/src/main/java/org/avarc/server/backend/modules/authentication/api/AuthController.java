package org.avarc.server.backend.modules.authentication.api;

import org.avarc.server.backend.modules.authentication.internal.AuthService;
import org.avarc.server.backend.modules.security.JwtService;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/rest/v0.1.0/auth")
@Tag(name = "Authentication", description = "Authentication endpoints")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    private final JwtService jwtService;

    @PostMapping("/register")
    @Operation(
        summary = "Register a new user",
        description = "Registers a new user and returns a JWT token.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User registration data",
            required = true,
            content = @Content(examples = @ExampleObject(
                name = "Register Request Example",
                value = "{ \"username\": \"jane.doe\", \"password\": \"password123\" }"
            ))
        ),
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Successful registration",
                content = @Content(examples = @ExampleObject(
                    value = "{\"token\":\"eyJhbGciOiJIUzI1NiIs...\",\"user\":{\"username\":\"jane.doe\"},\"errorCode\":null,\"errorMessage\":null}"
                ))
            ),
            @ApiResponse(
                responseCode = "400",
                description = "Registration failed",
                content = @Content(examples = @ExampleObject(
                    value = "{ \"user\": null, \"errorCode\": \"REGISTER_ERROR\", \"errorMessage\": \"Username already exists\" }"
                ))
            )
        }
    )
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        log.debug("→ Entering register()");
        try {
            UserDto user = authService.register(request);
            String token = jwtService.generateToken(user.getUsername(), user.getUuid(), user.getRoles());
            return ResponseEntity.ok(new AuthResponse(user, token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse("REGISTER_ERROR", e.getMessage()));
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
            String token = jwtService.generateToken(user.getUsername(), user.getUuid(), user.getRoles());
            return ResponseEntity.ok(new AuthResponse(user, token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse("LOGIN_ERROR", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    @Operation(
        summary = "Logout user",
        description = "Invalidates the user's session. Note: This is a dummy endpoint - the frontend should always invalidate local storage regardless of the response.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Logout successful",
                content = @Content(examples = @ExampleObject(
                    value = "{\"user\":null,\"token\":null,\"errorCode\":null,\"errorMessage\":\"Logout successful\"}"
                ))
            )
        }
    )
    public ResponseEntity<AuthResponse> logout() {
        log.debug("→ Entering logout()");
        // TODO: In a production environment, this should:
        // 1. Add the JWT to a blacklist in Redis
        // 2. Set an expiration time for the blacklisted token
        // 3. Implement token validation to check against the blacklist
        return ResponseEntity.ok(new AuthResponse(null, null, null, "Logout successful"));
    }
}

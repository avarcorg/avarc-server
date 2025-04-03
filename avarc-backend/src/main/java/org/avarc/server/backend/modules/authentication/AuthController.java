package org.avarc.server.backend.modules.authentication;

import java.util.Map;
import java.util.Optional;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.avarc.server.backend.modules.authentication.internal.JwtService;
import org.avarc.server.backend.modules.shared.ApiConstants;
import org.avarc.server.backend.modules.user.User;
import org.avarc.server.backend.modules.user.internal.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.REST_PREFIX + "/auth")
@CrossOrigin
@Tag(name = "Authentication (" + ApiConstants.API_VERSION + ")", description = "Versioned authentication endpoints")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    @Operation(
        summary = "Register a new user",
        tags = {"Authentication (" + ApiConstants.API_VERSION + ")"},
        responses = {
            @ApiResponse(responseCode = "200", description = "User registered",
                         content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Registration failed",
                         content = @Content(schema = @Schema(implementation = AuthResponse.class)))
        }
    )
    public ResponseEntity<AuthResponse> register(@RequestBody Map<String, String> body) {
        try {
            String username = body.get("username");
            String password = body.get("password");
            userService.register(username, password);
            Optional<User> user = userService.getUserByUsername(username);
            return user.map(u -> ResponseEntity.ok(new AuthResponse(jwtService.generateToken(username), u)))
                .orElseGet(() -> ResponseEntity.badRequest().body(
                    new AuthResponse("REGISTER_ERROR", "User registration succeeded, but user retrieval failed.")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse("REGISTER_FAILED", e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Operation(
        summary = "Login user and return JWT token",
        tags = {"Authentication (" + ApiConstants.API_VERSION + ")"},
        responses = {
            @ApiResponse(responseCode = "200", description = "Login successful",
                         content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized",
                         content = @Content(schema = @Schema(implementation = AuthResponse.class)))
        }
    )
    public ResponseEntity<AuthResponse> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        return userService.authenticate(username, password)
            .flatMap(u -> userService.getUserByUsername(u)
                .map(user -> ResponseEntity.ok(new AuthResponse(jwtService.generateToken(username), user))))
            .orElseGet(() -> ResponseEntity.status(401).body(
                new AuthResponse("LOGIN_FAILED", "Invalid credentials")));
    }
}

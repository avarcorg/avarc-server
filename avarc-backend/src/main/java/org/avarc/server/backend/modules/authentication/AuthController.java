package org.avarc.server.backend.modules.authentication;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.avarc.server.backend.modules.authentication.internal.JwtService;
import org.avarc.server.backend.modules.user.internal.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin
@Tag(name = "Authentication", description = "Endpoints for user login and registration")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public String register(@RequestBody Map<String, String> body) {
        userService.register(body.get("username"), body.get("password"));
        return "Registered";
    }

    @PostMapping("/login")
    @Operation(summary = "Login user and return JWT token")
    public String login(@RequestBody Map<String, String> body) {
        return userService.authenticate(body.get("username"), body.get("password"))
                .map(jwtService::generateToken)
                .orElse("Unauthorized");
    }
}

package org.avarc.server.backend.modules.authentication.api;

import lombok.RequiredArgsConstructor;
import org.avarc.server.backend.modules.authentication.internal.AuthService;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        try {
            UserDto user = authService.register(request);
            return ResponseEntity.ok(new AuthResponse(user, null, null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, "REGISTER_ERROR", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            UserDto user = authService.authenticate(request);
            return ResponseEntity.ok(new AuthResponse(user, null, null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, "LOGIN_ERROR", e.getMessage()));
        }
    }
}

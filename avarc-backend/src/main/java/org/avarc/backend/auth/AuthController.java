
package org.avarc.backend.auth;

import java.util.Map;
import jakarta.servlet.http.HttpSession;
import org.avarc.backend.user.User;
import org.avarc.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody Map<String, String> loginData, HttpSession session) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        // Log the received data
        LOGGER.info("Received login data: " + loginData);
        LOGGER.info("Attempting to login user {} with password {}", email, password);

        // REALLY? - The actual authentication is handled by Spring Security

        // For simplicity, we're not hashing passwords in this example
        email = "hakan@tandogan.com";

        // TODO handle multiple users with the same password
        User user = userRepository.findByEmail(email);
        if (user != null) {
            session.setAttribute("user", user);
            return new AuthResponse(true, "Login successful", user);
        } else {
            return new AuthResponse(false, "Invalid email or password", null);
        }
    }

    @GetMapping("/success")
    public AuthResponse success(HttpSession session) {
        LOGGER.info("Checking for user in session {}", session.getId());
        LOGGER.info("Full Session {}", session);
        User user = (User) session.getAttribute("user");
        if (user != null) {
            return new AuthResponse(true, "User is logged in", user);
        } else {
            return new AuthResponse(false, "No user in session", null);
        }
    }
}

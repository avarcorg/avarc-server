package org.avarc.server.backend.modules.authentication.internal;

import org.avarc.server.backend.modules.authentication.api.AuthRequest;
import org.avarc.server.backend.modules.authentication.api.AuthResponse;
import org.avarc.server.backend.modules.user.api.UserAccess;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserAccess userAccess;

    public AuthService(UserAccess userAccess) {
        this.userAccess = userAccess;
    }

    public AuthResponse register(AuthRequest request) {
        UserDto userDto = userAccess.register(request.getUsername(), request.getPassword());
        return new AuthResponse("dummy-token", userDto);
    }

    public AuthResponse authenticate(AuthRequest request) {
        UserDto userDto = userAccess.findByUsername(request.getUsername());
        if (userDto != null && request.getPassword().equals("known-pass")) { // dummy password check placeholder
            return new AuthResponse("dummy-token", userDto);
        }
        return null;
    }
}

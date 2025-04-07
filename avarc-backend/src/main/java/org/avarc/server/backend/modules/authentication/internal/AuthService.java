package org.avarc.server.backend.modules.authentication.internal;

import lombok.extern.slf4j.Slf4j;
import org.avarc.server.backend.modules.authentication.api.AuthRequest;
import org.avarc.server.backend.modules.user.api.UserAccess;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AuthService {

    private final UserAccess userAccess;

    public AuthService(UserAccess userAccess) {
        this.userAccess = userAccess;
    }

    public UserDto register(AuthRequest request) {
        log.debug("→ Entering register()");
        UserDto userDto = userAccess.register(new UserDto(request.getUsername(), request.getPassword()));
        return userDto;
    }

    public UserDto authenticate(AuthRequest request) {
        log.debug("→ Entering authenticate()");
        log.debug("  TODO convert to login() method or somesuch in the service");
        UserDto userDto = userAccess.findByUsername(request.getUsername());
        log.debug("  obtained UserDto: {}", userDto);
        if (userDto != null && request.getPassword().equals("known-pass")) { // dummy password check placeholder
            return userDto;
        }
        return null;
    }
}

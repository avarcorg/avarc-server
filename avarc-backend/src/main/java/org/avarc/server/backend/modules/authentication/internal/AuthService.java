package org.avarc.server.backend.modules.authentication.internal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.avarc.server.backend.modules.authentication.api.AuthRequest;
import org.avarc.server.backend.modules.security.JwtService;
import org.avarc.server.backend.modules.user.api.UserAccess;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserAccess userAccess;

    private final JwtService jwtService;

    public UserDto register(AuthRequest request) {
        log.debug("→ Entering register()");
        UserDto userDto = userAccess.register(new UserDto(request.getUsername(), request.getPassword()));
        return userDto;
    }

    public UserDto authenticate(AuthRequest request) {
        log.debug("→ Entering authenticate()");
        UserDto userDto = userAccess.login(new UserDto(request.getUsername(), request.getPassword()));
        return userDto;
    }
}

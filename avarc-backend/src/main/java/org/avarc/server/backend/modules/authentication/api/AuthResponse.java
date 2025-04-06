package org.avarc.server.backend.modules.authentication.api;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.avarc.server.backend.modules.user.api.UserDto;

@Data
@AllArgsConstructor
public class AuthResponse {
    private UserDto user;
    private String errorCode;
    private String errorMessage;
}

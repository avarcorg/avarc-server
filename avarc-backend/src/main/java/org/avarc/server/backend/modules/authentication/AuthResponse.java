package org.avarc.server.backend.modules.authentication;

import lombok.Data;
import org.avarc.server.backend.modules.user.User;

@Data
public class AuthResponse {

    private String token;
    private User user;
    private String errorCode;
    private String errorMessage;

    public AuthResponse() {
    }

    public AuthResponse(String token, User user) {
        this.token = token;
        this.user = user;
    }

    public AuthResponse(String errorCode, String errorMessage) {
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }
}

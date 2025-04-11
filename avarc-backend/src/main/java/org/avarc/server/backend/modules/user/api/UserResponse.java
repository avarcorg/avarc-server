package org.avarc.server.backend.modules.user.api;

import lombok.Data;

@Data
public class UserResponse {
    private UserDto user;
    private String token;
    private String errorCode;
    private String errorMessage;

    // Constructor for success response (user and token)
    public UserResponse(UserDto user) {
        this.user = user;
    }

    // Constructor for success response (user and token)
    public UserResponse(UserDto user, String token) {
        this.user = user;
        this.token = token;
    }

    // Constructor for error response (errorCode and errorMessage)
    public UserResponse(String errorCode, String errorMessage) {
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }
}

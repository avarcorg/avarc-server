package org.avarc.server.backend.modules.dashboard.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.avarc.server.backend.modules.user.api.UserDto;

@Data
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private UserDto user;
    private String token;
    private String errorCode;
    private String errorMessage;

    // Constructor for success response (user and token)
    public DashboardResponse(UserDto user, String token) {
        this.user = user;
        this.token = token;
        this.errorCode = null;
        this.errorMessage = null;
    }

    // Constructor for error response (errorCode and errorMessage)
    public DashboardResponse(String errorCode, String errorMessage) {
        this.user = null;
        this.token = null;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
    }
}

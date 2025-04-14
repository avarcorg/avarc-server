package org.avarc.server.backend.modules.authentication.api;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Authentication request containing user credentials")
public class AuthRequest {
    @Schema(description = "User's username", example = "john.doe")
    private String username;

    @Schema(description = "User's password", example = "password123")
    private String password;
}

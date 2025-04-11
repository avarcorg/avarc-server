package org.avarc.server.backend.modules.user.api;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID uuid;
    private String username;
    private String password;
    private List<Role> roles;

    public UserDto(String username, String password) {
        this.username = username;
        this.password = password;
        this.roles = Collections.emptyList();
    }
}

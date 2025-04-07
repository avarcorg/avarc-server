package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    // TODO convert to mapstruct later

    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }

        UserDto dto = new UserDto();
        dto.setUsername(user.getUsername());
        dto.setPassword(user.getPassword()); // Be cautious exposing passwords
        dto.setRoles(user.getRoles());

        return dto;
    }

    public User fromDto(UserDto dto) {
        if (dto == null) {
            return null;
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setRoles(dto.getRoles());

        return user;
    }
}

package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.model.User;

public class UserMapper {
    public static UserDto toDto(User user) {
        return new UserDto(user.getUsername());
    }
}

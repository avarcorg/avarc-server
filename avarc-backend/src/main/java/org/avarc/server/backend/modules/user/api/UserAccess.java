package org.avarc.server.backend.modules.user.api;

public interface UserAccess {
    UserDto login(UserDto requestDto);
    UserDto register(UserDto requestDto);
}

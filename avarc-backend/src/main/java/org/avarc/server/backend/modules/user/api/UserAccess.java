package org.avarc.server.backend.modules.user.api;

public interface UserAccess {
    UserDto findByUsername(String username);
    UserDto register(String username, String password);
}

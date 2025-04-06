package org.avarc.server.backend.modules.user.api;

import org.avarc.server.backend.modules.user.internal.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UserAccessConfiguration {

    private final UserService userService;

    public UserAccessConfiguration(UserService userService) {
        this.userService = userService;
    }

    @Bean
    public UserAccess userAccess() {
        return userService;
    }
}

package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.user.api.UserAccess;
import org.avarc.server.backend.modules.user.api.UserApi;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.model.User;
import org.springframework.stereotype.Service;

@Service
public class UserService implements UserAccess, UserApi {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public UserDto findByUsername(String username) {
        return UserMapper.toDto(userRepository.findByUsername(username));
    }

    @Override
    public UserDto register(String username, String password) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        return UserMapper.toDto(userRepository.save(user));
    }

    @Override
    public UserDto createSampleUser() {
        return new UserDto("sample-from-api");
    }
}

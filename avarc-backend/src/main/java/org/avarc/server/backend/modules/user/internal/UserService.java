package org.avarc.server.backend.modules.user.internal;

import lombok.RequiredArgsConstructor;
import org.avarc.server.backend.modules.user.api.UserAccess;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.model.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserAccess {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserDto createUser(UserDto dto) {
        User user = userMapper.fromDto(dto);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        return userMapper.toDto(userRepository.save(user));
    }

    @Deprecated(forRemoval = true)
    public UserDto createSampleUser() {
        return createUser(new UserDto("sample-from-api", ""));
    }

    public UserDto login(UserDto requestDto) {
        return userRepository.findByUsername(requestDto.getUsername())
            .filter(user -> passwordEncoder.matches(requestDto.getPassword(), user.getPassword()))
            .map(userMapper::toDto)
            .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
    }

    public UserDto findByUsername(String username) {
        return userRepository.findByUsername(username)
            .map(userMapper::toDto)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }

    @Override
    public UserDto register(UserDto requestDto) {
        userRepository.findByUsername(requestDto.getUsername())
            .ifPresent(result -> {
                throw new IllegalStateException("User already exists: " + requestDto.getUsername());
            });

        User user = userMapper.fromDto(requestDto);
        user.setPassword(passwordEncoder.encode(requestDto.getPassword()));

        return userMapper.toDto(userRepository.save(user));
    }
}

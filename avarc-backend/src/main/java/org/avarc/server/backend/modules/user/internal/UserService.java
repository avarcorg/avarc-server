package org.avarc.server.backend.modules.user.internal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.avarc.server.backend.modules.user.api.UserAccess;
import org.avarc.server.backend.modules.user.api.UserApi;
import org.avarc.server.backend.modules.user.api.UserDto;
import org.avarc.server.backend.modules.user.model.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService implements UserAccess, UserApi {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserDto createUser(UserDto dto) {
        User user = userMapper.toEntity(dto);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user = userRepository.save(user);
        log.debug("  Created user: {}", user);
        return userMapper.toDto(user);
    }

    @Deprecated(forRemoval = true)
    public UserDto createSampleUser() {
        return new UserDto("sample-from-api", "");
    }

    public UserDto login(UserDto requestDto) {
        log.debug("→ Entering login()");
        return userRepository.findByUsername(requestDto.getUsername())
            .filter(user -> passwordEncoder.matches(requestDto.getPassword(), user.getPassword()))
            .map(userMapper::toDto)
            .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
    }

    public UserDto findByUsername(String username) {
        log.debug("→ Entering findByUsername()");
        return userRepository.findByUsername(username)
            .map(userMapper::toDto)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }

    public UserDto findByUuid(UUID uuid) {
        log.debug("→ Entering findByUuid()");
        return userRepository.findByUuid(uuid)
            .map(userMapper::toDto)
            .orElseThrow(() -> new IllegalArgumentException("User not found with UUID: " + uuid));
    }

    @Override
    public UserDto register(UserDto requestDto) {
        log.debug("→ Entering register()");
        userRepository.findByUsername(requestDto.getUsername())
            .ifPresent(result -> {
                throw new IllegalStateException("User already exists: " + requestDto.getUsername());
            });

        User user = userMapper.toEntity(requestDto);
        user.setUuid(UUID.randomUUID());
        user.setPassword(passwordEncoder.encode(requestDto.getPassword()));

        return userMapper.toDto(userRepository.save(user));
    }

    public UserDto updateUser(UUID uuid, UserDto updateDto) {
        log.debug("→ Entering updateUser()");
        User existingUser = userRepository.findByUuid(uuid)
            .orElseThrow(() -> new IllegalArgumentException("User not found with UUID: " + uuid));

        // Check if new username is already taken by another user
        if (!existingUser.getUsername().equals(updateDto.getUsername())) {
            userRepository.findByUsername(updateDto.getUsername())
                .ifPresent(user -> {
                    throw new IllegalStateException("Username already taken: " + updateDto.getUsername());
                });
        }

        existingUser.setUsername(updateDto.getUsername());
        if (updateDto.getPassword() != null && !updateDto.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(updateDto.getPassword()));
        }

        User updatedUser = userRepository.save(existingUser);
        return userMapper.toDto(updatedUser);
    }
}

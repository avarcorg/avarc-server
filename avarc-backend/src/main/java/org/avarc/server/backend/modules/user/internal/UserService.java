package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void register(String username, String rawPassword) {
        String encoded = passwordEncoder.encode(rawPassword);
        userRepository.save(new User(username, encoded));
    }

    public Optional<String> authenticate(String username, String rawPassword) {
        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(rawPassword, user.getPassword()))
                .map(User::getUsername); // return username if valid
    }
}

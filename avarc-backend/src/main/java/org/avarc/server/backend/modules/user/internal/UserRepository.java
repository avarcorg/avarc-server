package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUuid(UUID uuid);
}

package org.avarc.server.backend.modules.user.internal;

import java.util.Optional;
import java.util.UUID;
import org.avarc.server.backend.modules.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByUuid(UUID uuid);
}

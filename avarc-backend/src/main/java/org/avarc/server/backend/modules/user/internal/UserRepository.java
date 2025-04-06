package org.avarc.server.backend.modules.user.internal;

import org.avarc.server.backend.modules.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}

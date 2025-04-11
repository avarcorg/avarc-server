package org.avarc.server.backend.modules.user.internal;

import java.util.Optional;
import java.util.UUID;

import org.avarc.server.backend.modules.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUuid(UUID uuid);

    @Modifying
    @Query("UPDATE User u SET u.username = :username WHERE u.uuid = :uuid")
    void updateUsernameByUuid(@Param("uuid") UUID uuid, @Param("username") String username);
}

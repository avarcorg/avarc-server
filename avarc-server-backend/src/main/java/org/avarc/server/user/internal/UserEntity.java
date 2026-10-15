package org.avarc.server.user.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "app_user")
class UserEntity {

    @Id
    UUID id;

    @Column(nullable = false, unique = true, updatable = false)
    String subject;

    String username;
    String email;

    @Column(name = "first_name")
    String firstName;

    @Column(name = "last_name")
    String lastName;

    @Column(name = "display_name")
    String displayName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    Map<String, Object> preferences = new LinkedHashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "last_login_at", nullable = false)
    Instant lastLoginAt;

    protected UserEntity() {}

    UserEntity(String subject, Instant now) {
        this.id = UUID.randomUUID();
        this.subject = subject;
        this.createdAt = now;
        this.lastLoginAt = now;
    }
}

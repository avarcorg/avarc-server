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

    @Column(name = "kc_subject", nullable = false, unique = true, updatable = false)
    String subject;

    @Column(name = "kc_username")
    String username;

    @Column(name = "kc_email")
    String email;

    @Column(name = "kc_first_name")
    String firstName;

    @Column(name = "kc_last_name")
    String lastName;

    @Column(name = "kc_display_name")
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

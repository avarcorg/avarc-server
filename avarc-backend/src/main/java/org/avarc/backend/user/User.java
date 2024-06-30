package org.avarc.backend.user;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonProperty.Access;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = User.TABLE_NAME, schema = "public")
@Data
public class User implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    // to avoid H2 SQL syntax error
    public static final String TABLE_NAME = "USERS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    @JsonProperty(access = Access.READ_ONLY)
    private UUID guuid;

    // @Column(unique = true)
    @JsonProperty("username")
    private String username;

    // @Column(unique = true)
    @JsonProperty("email")
    private String email;

    @JsonIgnore
    private String password;

    @PrePersist
    protected void onCreate() {
        guuid = UUID.randomUUID();
    }
}

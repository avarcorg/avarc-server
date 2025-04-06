package org.avarc.server.backend.modules.user.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = User.TABLE_NAME)
@Data
public class User {

    // to avoid H2 SQL syntax error
    public static final String TABLE_NAME = "USERS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
}

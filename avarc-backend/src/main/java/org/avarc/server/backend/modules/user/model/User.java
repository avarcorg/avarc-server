package org.avarc.server.backend.modules.user.model;

import jakarta.persistence.*;
import lombok.Data;
import org.avarc.server.backend.modules.user.api.Role;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = User.TABLE_NAME)
@Data
public class User {

    // to avoid H2 SQL syntax error
    public static final String TABLE_NAME = "USERS";

    public static final String ROLE_TABLE_NAME = "USER_ROLES";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = ROLE_TABLE_NAME, joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private List<Role> roles = new ArrayList<>();
}

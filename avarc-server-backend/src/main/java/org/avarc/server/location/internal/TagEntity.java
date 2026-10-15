package org.avarc.server.location.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tag")
class TagEntity {

    @Id
    @Column(name = "key")
    String key;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    Map<String, String> labels = new LinkedHashMap<>();

    protected TagEntity() {}

    TagEntity(String key) {
        this.key = key;
    }
}

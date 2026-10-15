package org.avarc.server.location.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Embeddable
class ReferenceData {

    String url;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    Map<String, String> citations = new LinkedHashMap<>();

    protected ReferenceData() {}

    ReferenceData(String url, Map<String, String> citations) {
        this.url = url;
        this.citations = new LinkedHashMap<>(citations);
    }
}

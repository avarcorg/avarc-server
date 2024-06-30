package org.avarc.backend.location;

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
import org.locationtech.jts.geom.Point;


@Entity
@Table(name = Location.TABLE_NAME, schema = "public")
@Data
public class Location {

    public static final String TABLE_NAME = "LOCATION";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("id")
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    @JsonProperty(access = Access.READ_ONLY)
    private UUID guuid;

    @JsonProperty("name")
    private String name;

    @JsonProperty("description")
    private String description;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    @Column(columnDefinition = "geometry(Point,4326)")
    @JsonIgnore
    private Point coordinates;

    @PrePersist
    protected void onCreate() {
        guuid = UUID.randomUUID();
    }
}

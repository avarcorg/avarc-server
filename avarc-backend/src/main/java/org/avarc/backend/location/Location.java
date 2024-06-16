package org.avarc.backend.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = Location.TABLE_NAME, schema = "public")
public class Location {

    public static final String TABLE_NAME= "LOCATION";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point coordinates;

    // Getters and setters
}

package org.avarc.server.location.internal;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** The generated geography column {@code position} is not mapped; latitude and longitude are. */
@Entity
@Table(name = "location")
class LocationEntity {

    @Id
    UUID id;

    @Column(name = "position_kind", nullable = false)
    String positionKind;

    Double latitude;
    Double longitude;

    @Column(name = "confidence_level", nullable = false)
    int confidenceLevel;

    @Column(name = "period_start")
    Instant periodStart;

    @Column(name = "period_end")
    Instant periodEnd;

    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    String createdBy;

    @Column(name = "updated_by", nullable = false)
    String updatedBy;

    @ElementCollection
    @CollectionTable(name = "location_translation", joinColumns = @JoinColumn(name = "location_id"))
    @MapKeyColumn(name = "language")
    Map<String, TranslationData> translations = new LinkedHashMap<>();

    @ManyToMany
    @JoinTable(
            name = "location_tag",
            joinColumns = @JoinColumn(name = "location_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_key"))
    Set<TagEntity> tags = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "location_reference", joinColumns = @JoinColumn(name = "location_id"))
    @OrderColumn(name = "ordinal")
    List<ReferenceData> references = new ArrayList<>();

    protected LocationEntity() {}

    LocationEntity(UUID id, Instant now, String actor) {
        this.id = id;
        this.createdAt = now;
        this.createdBy = actor;
    }
}

package org.avarc.server.location.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
class TranslationData {

    @Column(nullable = false)
    String name;

    @Column(nullable = false)
    String description;

    @Column(name = "period_label")
    String periodLabel;

    @Column(name = "confidence_level", nullable = false)
    int confidenceLevel;

    protected TranslationData() {}

    TranslationData(String name, String description, String periodLabel, int confidenceLevel) {
        this.name = name;
        this.description = description;
        this.periodLabel = periodLabel;
        this.confidenceLevel = confidenceLevel;
    }
}

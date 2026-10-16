package org.avarc.server.location.internal;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.avarc.server.location.TagService;
import org.avarc.server.location.TagSummary;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class DefaultTagService implements TagService {

    private final TagRepository tags;
    private final TagRules rules;

    DefaultTagService(TagRepository tags, TagRules rules) {
        this.tags = tags;
        this.rules = rules;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagSummary> list() {
        Map<String, Long> used = tags.usage().stream()
                .collect(Collectors.toMap(TagRepository.Usage::getKey, TagRepository.Usage::getLocations));
        return tags.findAll(Sort.by("key")).stream()
                .map(t -> new TagSummary(t.key, new TreeMap<>(t.labels), used.getOrDefault(t.key, 0L)))
                .toList();
    }

    @Override
    @Transactional
    public TagSummary setLabels(String key, Map<String, String> labels) {
        String normalised = rules.key(key);
        Map<String, String> checked = rules.labels(labels);
        TagEntity tag = tags.findById(normalised).orElseGet(() -> new TagEntity(normalised));
        tag.labels = new LinkedHashMap<>(checked);
        tags.saveAndFlush(tag);
        long locations = tags.usage().stream()
                .filter(u -> u.getKey().equals(normalised))
                .mapToLong(TagRepository.Usage::getLocations)
                .sum();
        return new TagSummary(normalised, new TreeMap<>(tag.labels), locations);
    }
}

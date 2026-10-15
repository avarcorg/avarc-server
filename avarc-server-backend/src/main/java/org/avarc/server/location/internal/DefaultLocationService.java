package org.avarc.server.location.internal;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.regex.Pattern;
import org.avarc.server.location.InvalidLocationException;
import org.avarc.server.location.Location;
import org.avarc.server.location.LocationInput;
import org.avarc.server.location.LocationNotFoundException;
import org.avarc.server.location.LocationPage;
import org.avarc.server.location.LocationService;
import org.avarc.server.location.Position;
import org.avarc.server.location.Reference;
import org.avarc.server.location.Tag;
import org.avarc.server.location.Translation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Validates against the rules of spec/SPEC-locations.md and stores through JPA. */
@Service
class DefaultLocationService implements LocationService {

    private static final int DEFAULT_CONFIDENCE = 3;
    private static final Pattern TAG_KEY = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final int TAG_KEY_MAX = 64;

    private final LocationRepository locations;
    private final TagRepository tags;
    private final Set<String> languages;

    DefaultLocationService(
            LocationRepository locations,
            TagRepository tags,
            @Value("${avarc.locations.languages:en,de}") Set<String> languages) {
        this.locations = locations;
        this.tags = tags;
        this.languages = languages;
    }

    @Override
    @Transactional(readOnly = true)
    public LocationPage list(int page, int size) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new InvalidLocationException("page must be 0 or more and size between 1 and " + MAX_PAGE_SIZE);
        }
        Page<LocationEntity> found = locations.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id"))));
        return new LocationPage(
                found.getContent().stream()
                        .map(DefaultLocationService::toLocation)
                        .toList(),
                page,
                size,
                found.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Location get(UUID id) {
        return toLocation(locations.findById(id).orElseThrow(() -> new LocationNotFoundException(id)));
    }

    @Override
    @Transactional
    public Location create(LocationInput input, String actor) {
        LocationEntity entity = new LocationEntity(UUID.randomUUID(), now(), actor);
        apply(entity, input, actor);
        return toLocation(locations.save(entity));
    }

    @Override
    @Transactional
    public Location update(UUID id, LocationInput input, String actor) {
        LocationEntity entity = locations.findById(id).orElseThrow(() -> new LocationNotFoundException(id));
        apply(entity, input, actor);
        return toLocation(locations.saveAndFlush(entity));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        locations.delete(locations.findById(id).orElseThrow(() -> new LocationNotFoundException(id)));
    }

    /** Checks the input as a whole first, then copies it, so a rejected request changes nothing. */
    private void apply(LocationEntity entity, LocationInput input, String actor) {
        Position position = input.position();
        if (position == null || !"point".equals(position.kind())) {
            throw new InvalidLocationException("position must be of kind point");
        }
        if (position.latitude() == null
                || position.longitude() == null
                || Math.abs(position.latitude()) > 90
                || Math.abs(position.longitude()) > 180) {
            throw new InvalidLocationException("latitude must be within -90 and 90, longitude within -180 and 180");
        }
        int confidence = confidence(input.confidenceLevel(), "confidenceLevel");
        if (input.periodStart() != null
                && input.periodEnd() != null
                && input.periodStart().isAfter(input.periodEnd())) {
            throw new InvalidLocationException("periodStart must not be after periodEnd");
        }
        Map<String, TranslationData> translations = translations(input.translations());
        List<ReferenceData> references = references(input.references());
        Set<TagEntity> resolvedTags = resolveTags(input.tags());

        entity.positionKind = position.kind();
        entity.latitude = position.latitude();
        entity.longitude = position.longitude();
        entity.confidenceLevel = confidence;
        entity.periodStart = input.periodStart();
        entity.periodEnd = input.periodEnd();
        entity.updatedAt = now();
        entity.updatedBy = actor;
        entity.translations.clear();
        entity.translations.putAll(translations);
        entity.references.clear();
        entity.references.addAll(references);
        entity.tags.clear();
        entity.tags.addAll(resolvedTags);
    }

    /** The database keeps microseconds, so the response must not show more. */
    private static Instant now() {
        return Instant.now().truncatedTo(ChronoUnit.MICROS);
    }

    private static int confidence(Integer level, String field) {
        if (level == null) {
            return DEFAULT_CONFIDENCE;
        }
        if (level < 1 || level > 5) {
            throw new InvalidLocationException(field + " must be between 1 and 5");
        }
        return level;
    }

    private Map<String, TranslationData> translations(Map<String, Translation> given) {
        if (given == null || given.isEmpty()) {
            throw new InvalidLocationException("at least one translation is required");
        }
        Map<String, TranslationData> result = new LinkedHashMap<>();
        given.forEach((language, t) -> {
            checkLanguage(language);
            if (t == null || isBlank(t.name()) || isBlank(t.description())) {
                throw new InvalidLocationException("translation " + language + " needs a name and a description");
            }
            result.put(
                    language,
                    new TranslationData(
                            t.name(),
                            t.description(),
                            t.periodLabel(),
                            confidence(t.confidenceLevel(), "translation " + language + " confidenceLevel")));
        });
        return result;
    }

    private List<ReferenceData> references(List<Reference> given) {
        List<ReferenceData> result = new ArrayList<>();
        for (Reference r : given == null ? List.<Reference>of() : given) {
            if (r == null || r.citations() == null || r.citations().isEmpty()) {
                throw new InvalidLocationException("a reference needs a citation");
            }
            checkTexts(r.citations(), "citation");
            result.add(new ReferenceData(url(r.url()), r.citations()));
        }
        return result;
    }

    /** A link is shown to users, so only http and https are accepted. */
    private static String url(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (uri.getHost() == null || !(scheme.equals("http") || scheme.equals("https"))) {
                throw new InvalidLocationException("a reference url must be an absolute http or https address");
            }
            return url;
        } catch (URISyntaxException e) {
            throw new InvalidLocationException("a reference url must be an absolute http or https address");
        }
    }

    private Set<TagEntity> resolveTags(List<Tag> given) {
        Map<String, Tag> byKey = new LinkedHashMap<>();
        for (Tag tag : given == null ? List.<Tag>of() : given) {
            String key =
                    tag == null || tag.key() == null ? "" : tag.key().trim().toLowerCase(Locale.ROOT);
            if (key.length() > TAG_KEY_MAX || !TAG_KEY.matcher(key).matches()) {
                throw new InvalidLocationException(
                        "a tag key is 1 to " + TAG_KEY_MAX + " characters of a-z, 0-9 and single hyphens");
            }
            if (tag.labels() != null) {
                checkTexts(tag.labels(), "tag label");
            }
            if (byKey.put(key, tag) != null) {
                throw new InvalidLocationException("tag " + key + " is given twice");
            }
        }
        Map<String, TagEntity> existing = new LinkedHashMap<>();
        tags.findAllById(byKey.keySet()).forEach(t -> existing.put(t.key, t));
        Set<TagEntity> result = new java.util.LinkedHashSet<>();
        byKey.forEach((key, tag) -> {
            TagEntity entity = existing.get(key);
            if (entity == null) {
                entity = new TagEntity(key);
            }
            if (tag.labels() != null) {
                entity.labels = new LinkedHashMap<>(tag.labels());
            }
            result.add(tags.save(entity));
        });
        return result;
    }

    private void checkTexts(Map<String, String> texts, String what) {
        texts.forEach((language, text) -> {
            checkLanguage(language);
            if (isBlank(text)) {
                throw new InvalidLocationException("a " + what + " must not be empty");
            }
        });
    }

    private void checkLanguage(String language) {
        if (!languages.contains(language)) {
            throw new InvalidLocationException("language " + language + " is not supported");
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static Location toLocation(LocationEntity e) {
        Map<String, Translation> translations = new TreeMap<>();
        e.translations.forEach((language, t) ->
                translations.put(language, new Translation(t.name, t.description, t.periodLabel, t.confidenceLevel)));
        List<Tag> tagList = e.tags.stream()
                .sorted(Comparator.comparing((TagEntity t) -> t.key))
                .map(t -> new Tag(t.key, new TreeMap<>(t.labels)))
                .toList();
        List<Reference> referenceList = e.references.stream()
                .map(r -> new Reference(r.url, new TreeMap<>(r.citations)))
                .toList();
        return new Location(
                e.id,
                new Position(e.positionKind, e.latitude, e.longitude),
                e.confidenceLevel,
                e.periodStart,
                e.periodEnd,
                translations,
                tagList,
                referenceList,
                e.createdAt,
                e.updatedAt,
                e.createdBy,
                e.updatedBy);
    }
}

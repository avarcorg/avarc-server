package org.avarc.server.observability;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.json.JsonWriter;
import org.springframework.boot.logging.structured.StructuredLogFormatter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/**
 * One JSON object per log line with the fields shared by all services (spec/SPEC-observability.md): the time in UTC,
 * the level, the service, the request ID, the user ID, the message. The user ID is the subject of the logged-in
 * user, an opaque ID and no personal data. Fields added to a log call (key-value pairs) are written as well.
 * Selected by {@code logging.structured.format.console}.
 */
public class JsonLogFormatter implements StructuredLogFormatter<ILoggingEvent> {

    private final JsonWriter<ILoggingEvent> writer = JsonWriter.<ILoggingEvent>of(members -> {
                members.add("timestamp", event -> DateTimeFormatter.ISO_INSTANT.format(event.getInstant()));
                members.add("level", event -> event.getLevel().toString());
                members.add("service", () -> "backend");
                members.add("request_id", event -> event.getMDCPropertyMap().get(RequestIdFilter.MDC_KEY))
                        .whenNotNull();
                members.add("user_id", event -> userId()).whenNotNull();
                members.add("logger", event -> event.getLoggerName());
                members.add("message", event -> event.getFormattedMessage());
                members.addMapEntries(event -> fields(event));
                members.add(
                                "exception",
                                event -> event.getThrowableProxy() == null
                                        ? null
                                        : ThrowableProxyUtil.asString(event.getThrowableProxy()))
                        .whenNotNull();
            })
            .withNewLineAtEnd();

    @Override
    public String format(ILoggingEvent event) {
        return writer.writeToString(event);
    }

    private static Map<String, Object> fields(ILoggingEvent event) {
        Map<String, Object> fields = new LinkedHashMap<>();
        if (event.getKeyValuePairs() != null) {
            event.getKeyValuePairs().forEach(pair -> fields.put(pair.key, pair.value));
        }
        return fields;
    }

    private static String userId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof OidcUser user
                ? user.getSubject()
                : null;
    }
}

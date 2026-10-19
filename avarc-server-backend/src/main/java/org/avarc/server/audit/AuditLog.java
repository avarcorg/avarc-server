package org.avarc.server.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Records who changed what, kept apart from the technical logs: the lines come from the logger {@code audit} and
 * carry the field {@code audit=true}, so that they can be kept longer. The user is the one of the request (field
 * {@code user_id}); only IDs are recorded, no content. See spec/SPEC-observability.md.
 */
@Component
public class AuditLog {

    private static final Logger LOG = LoggerFactory.getLogger("audit");

    /** {@code action} is like {@code location.created}; {@code entityType} and {@code entityId} say what changed. */
    public void record(String action, String entityType, Object entityId) {
        LOG.atInfo()
                .addKeyValue("audit", true)
                .addKeyValue("action", action)
                .addKeyValue("entity_type", entityType)
                .addKeyValue("entity_id", String.valueOf(entityId))
                .log(action);
    }
}

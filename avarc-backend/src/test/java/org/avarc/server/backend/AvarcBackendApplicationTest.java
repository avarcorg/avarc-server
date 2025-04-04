package org.avarc.server.backend;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.core.Violations;

@Slf4j
public class AvarcBackendApplicationTest {

    ApplicationModules modules = ApplicationModules.of(AvarcBackendApplication.class);

    @Test
    void verifyModuleStructure() {
        // modules.verify();

        // For now, detect only violations and give some time to clean them up
        Violations v = modules.detectViolations();
        log.error("e: ", v);
    }
}

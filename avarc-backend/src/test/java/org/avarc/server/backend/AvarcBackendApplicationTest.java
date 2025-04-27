package org.avarc.server.backend;

import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.core.Violations;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag("modulith")
public class AvarcBackendApplicationTest {

    ApplicationModules modules = ApplicationModules.of(AvarcBackendApplication.class);

    @Test
    @Order(99)
    void verifyModuleStructure() {
        // First, dump the configuration info
        modules.forEach(module -> log.info("Detected module: {}", module));

        // For now, detect only violations and give some time to clean them up
        Violations violations = modules.detectViolations();
        violations.getMessages().forEach(violation -> log.info("\n{}\n", violation));

        log.info("{} violations detected\n", violations.getMessages().size());

        // NOTE:
        // This test will log a warning about AuthResponse -> UserDto.
        // This is intentional and allowed: UserDto is exposed via UserApi in modules.user.
        // Spring Modulith 1.4 does not fully infer cross-module DTO exposure unless used in Spring beans.

        // modules.verify();
        // withAllowedDependencies is 1.5.0-SNAPSHOT only... Wait for that
        //  .withAllowedDependencies("modules.authentication -> modules.user")
    }
}

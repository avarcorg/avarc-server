package org.avarc.server;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/** The module rule of spec/SPEC-backend.md: a broken boundary fails the build. */
class ModularityTests {

    private static final ApplicationModules MODULES = ApplicationModules.of(AvarcServerApplication.class);

    @Test
    void theModulesAreWellFormed() {
        MODULES.verify();
    }

    /** Writes the module overview and diagrams to target/spring-modulith-docs. */
    @Test
    void writesTheModuleDocumentation() {
        new Documenter(MODULES).writeModulesAsPlantUml().writeIndividualModulesAsPlantUml();
    }
}

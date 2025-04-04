package org.avarc.server.backend;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

@Slf4j
public class DocumentationGeneratorTest {

    ApplicationModules modules = ApplicationModules.of(AvarcBackendApplication.class);

    @Test
    void generateDocumentation() {
        Documenter documenter = new Documenter(modules);

        documenter
            .writeModulesAsPlantUml()
            .writeIndividualModulesAsPlantUml();
    }
}

package org.avarc.server;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/** One PostGIS container for all tests of a run, like the database of a deployment. */
@TestConfiguration(proxyBeanMethods = false)
public class TestDatabase {

    private static final PostgreSQLContainer POSTGIS = new PostgreSQLContainer(
            DockerImageName.parse("postgis/postgis:17-3.5").asCompatibleSubstituteFor("postgres"));

    static {
        POSTGIS.start();
    }

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgis() {
        return POSTGIS;
    }
}

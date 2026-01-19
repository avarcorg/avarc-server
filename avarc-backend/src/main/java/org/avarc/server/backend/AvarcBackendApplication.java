package org.avarc.server.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.annotation.PropertySources;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.modulith.Modulithic;

@SpringBootApplication
@PropertySources({
    @PropertySource(value = "application.yml"),
    @PropertySource(value = "application-secret.yml", ignoreResourceNotFound = true),
    @PropertySource(value = "git.properties"),
}
)
@EntityScan(basePackageClasses = AvarcBackendApplication.class)
@EnableJpaRepositories(basePackageClasses = AvarcBackendApplication.class)
@Modulithic
public class AvarcBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(AvarcBackendApplication.class, args);
    }
}

package org.avarc.server.backend;

import org.avarc.server.backend.modules.user.User;
import org.avarc.server.backend.modules.user.internal.UserRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.annotation.PropertySources;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@PropertySources({
    @PropertySource(value = "application.yml"),
    @PropertySource(value = "application-secret.yml", ignoreResourceNotFound = true),
    @PropertySource(value = "git.properties"),
}
)
@EntityScan(basePackageClasses = User.class)
@EnableJpaRepositories(basePackageClasses = UserRepository.class)
public class AvarcBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(AvarcBackendApplication.class, args);
    }
}

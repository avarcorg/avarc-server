package org.avarc.server.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.annotation.PropertySources;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, HibernateJpaAutoConfiguration.class})

@PropertySources({
    @PropertySource(value = "application.yml"),
    @PropertySource(value = "application-secret.yml", ignoreResourceNotFound = true)
}
)
public class AvarcBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(AvarcBackendApplication.class, args);
    }
}

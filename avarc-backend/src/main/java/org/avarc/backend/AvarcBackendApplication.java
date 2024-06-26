package org.avarc.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

@SpringBootApplication
@EnableRedisHttpSession
public class AvarcBackendApplication {

    private static final Logger LOGGER = LoggerFactory.getLogger(AvarcBackendApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(AvarcBackendApplication.class, args);
    }
}

package org.avarc.backend.configuration;

import java.util.Map;
import java.util.TreeMap;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ConfigurationDumper implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger LOGGER = LoggerFactory.getLogger(ConfigurationDumper.class);

    @Autowired
    private ConfigurableEnvironment  environment;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        LOGGER.debug("Active Profiles: {}", String.join(", ", environment.getActiveProfiles()));
        logAllProperties(environment);
    }

    private void logAllProperties(ConfigurableEnvironment environment) {
        Map<String, Object> properties = new TreeMap<>();
        StreamSupport.stream(environment.getPropertySources().spliterator(), false).
            filter(ps -> ps instanceof org.springframework.core.env.EnumerablePropertySource).
            map(ps -> (org.springframework.core.env.EnumerablePropertySource<?>) ps).
            forEach(ps -> {
            for (String name : ps.getPropertyNames()) {
                properties.put(name, ps.getProperty(name));
            }
        });

        properties.forEach((key, value) ->
            LOGGER.debug("    {} = {}", key, value));
    }
}

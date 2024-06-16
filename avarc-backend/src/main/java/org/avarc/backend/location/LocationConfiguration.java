package org.avarc.backend.location;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackageClasses = LocationModule.class)
public class LocationConfiguration {
}

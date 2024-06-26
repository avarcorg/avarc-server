package org.avarc.backend.auth;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackageClasses = AuthModule.class)
public class AuthConfiguration {
}

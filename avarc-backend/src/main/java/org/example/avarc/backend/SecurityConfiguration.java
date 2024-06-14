package org.example.avarc.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfiguration {
    @Bean
    SecurityFilterChain configure(HttpSecurity http) throws Exception {

        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        //     http
        //            .authorizeRequests()
        //                .antMatchers("/employee/me").authenticated()
        //                .antMatchers("/**").permitAll();

        return http.build();
    }
}

package org.avarc.server.hello;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "hello", description = "A greeting, to check the login")
public class HelloController {

    @Operation(summary = "Greets the logged-in user")
    @GetMapping("/api/hello")
    public String hello() {
        return "Hello, avarc!";
    }
}

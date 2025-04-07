package org.avarc.server.backend.modules.documentation;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
@Tag(name = "OpenAPI Export", description = "Download the full OpenAPI specification as JSON")
public class OpenApiExportController {

    @Value("${server.port:8080}")
    private int serverPort;

    private final RestTemplate restTemplate = new RestTemplate();

    private final ObjectMapper objectMapper = new ObjectMapper();


    @GetMapping(value = "/openapi.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> downloadOpenApiJson() throws JacksonException {
        String apiDocsUrl = "http://localhost:" + serverPort + "/v3/api-docs";

        String rawJson = restTemplate.getForObject(apiDocsUrl, String.class);
        Object jsonObject = objectMapper.readValue(rawJson, Object.class);
        String prettyJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonObject);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"openapi.json\"")
            .contentType(MediaType.APPLICATION_JSON)
            .body(prettyJson);
    }
}

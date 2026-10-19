package org.avarc.server;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** The actuator is on its own port, and the request ID comes back. See spec/SPEC-observability.md. */
@Import(TestDatabase.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class ObservabilityTests {

    private static final int SERVER = TestPorts.free();
    private static final int MANAGEMENT = TestPorts.free();

    private final HttpClient client = HttpClient.newHttpClient();

    @DynamicPropertySource
    static void ports(DynamicPropertyRegistry registry) {
        registry.add("server.port", () -> SERVER);
        registry.add("management.server.port", () -> MANAGEMENT);
        // test contexts switch metrics export off
        registry.add("management.defaults.metrics.export.enabled", () -> "true");
        registry.add("management.prometheus.metrics.export.enabled", () -> "true");
    }

    private HttpResponse<String> get(int port, String path, String... headers)
            throws IOException, InterruptedException {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (headers.length > 0) {
            request.headers(headers);
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void healthAndReadinessAreUpOnTheManagementPort() throws Exception {
        assertThat(get(MANAGEMENT, "/actuator/health").body()).contains("\"UP\"");
        assertThat(get(MANAGEMENT, "/actuator/health/liveness").statusCode()).isEqualTo(200);
        assertThat(get(MANAGEMENT, "/actuator/health/readiness").statusCode()).isEqualTo(200);
    }

    @Test
    void metricsAreServedOnTheManagementPort() throws Exception {
        get(SERVER, "/api/hello");
        String metrics = get(MANAGEMENT, "/actuator/prometheus").body();
        assertThat(metrics).contains("jvm_memory_used_bytes");
        assertThat(metrics).contains("http_server_requests_seconds_count");
        assertThat(metrics).contains("hikaricp_connections");
    }

    @Test
    void theApplicationPortDoesNotServeTheActuator() throws Exception {
        assertThat(get(SERVER, "/actuator/health").statusCode()).isNotEqualTo(200);
        assertThat(get(SERVER, "/actuator/prometheus").statusCode()).isNotEqualTo(200);
    }

    @Test
    void aValidRequestIdIsKeptAndReturned() throws Exception {
        HttpResponse<String> response = get(SERVER, "/api/hello", "X-Request-Id", "req-12345678");
        assertThat(response.headers().firstValue("X-Request-Id")).contains("req-12345678");
    }

    @Test
    void anInvalidOrMissingRequestIdIsReplaced() throws Exception {
        HttpResponse<String> invalid = get(SERVER, "/api/hello", "X-Request-Id", "bad id!");
        assertThat(invalid.headers().firstValue("X-Request-Id").orElseThrow()).matches("[0-9a-f]{32}");
        HttpResponse<String> missing = get(SERVER, "/api/hello");
        assertThat(missing.headers().firstValue("X-Request-Id").orElseThrow()).matches("[0-9a-f]{32}");
    }
}

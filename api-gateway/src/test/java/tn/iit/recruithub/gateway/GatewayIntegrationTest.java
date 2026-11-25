package tn.iit.recruithub.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.cloud.gateway.server.webflux.routes[0].id=recruitment-service",
                "spring.cloud.gateway.server.webflux.routes[0].uri=http://127.0.0.1:1",
                "spring.cloud.gateway.server.webflux.routes[0].predicates[0]=Path=/api/v1/**"
        })
class GatewayIntegrationTest {
    @Autowired
    private WebTestClient webTestClient;

    @Test
    void answersCorsPreflightForTheConfiguredFrontend() {
        webTestClient.options()
                .uri("/api/v1/offers")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
                .exchange()
                .expectStatus().is2xxSuccessful()
                .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:3000");
    }

    @Test
    void returnsBadGatewayWhenTheRecruitmentServiceCannotBeReached() {
        webTestClient.get()
                .uri("/api/v1/offers")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.BAD_GATEWAY)
                .expectBody()
                .json("{\"error\":\"Upstream service unavailable\"}");
    }
}

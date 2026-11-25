package tn.iit.recruithub.recruitment;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "recruithub.matching.grpc-port=1",
                "recruithub.recruitment.remote.retry-attempts=1",
                "recruithub.recruitment.retry-delay-ms=60000"
        })
class RecruitmentApplicationContextTest {
    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void persistsApplicationsWhenMatchingIsUnavailableAndServesTheOpenApi() {
        String baseUrl = "http://localhost:" + port;
        var swagger = restTemplate.getForEntity(baseUrl + "/swagger-ui/index.html", String.class);
        var openApi = restTemplate.getForEntity(baseUrl + "/openapi.yaml", String.class);
        assertEquals(HttpStatus.OK, swagger.getStatusCode());
        assertEquals(HttpStatus.OK, openApi.getStatusCode());
        assertTrue(openApi.getBody().contains("RecruitHub Recruitment API"));

        var candidateResponse = restTemplate.postForEntity(baseUrl + "/api/v1/candidates", Map.of(
                "firstName", "Test",
                "lastName", "Candidate",
                "email", "test-candidate@example.test",
                "skills", List.of("Java"),
                "experienceYears", 2), Map.class);
        var offerResponse = restTemplate.postForEntity(baseUrl + "/api/v1/offers", Map.of(
                "title", "Backend Developer",
                "requiredSkills", List.of("Java"),
                "requiredExperienceYears", 1), Map.class);
        assertEquals(HttpStatus.CREATED, candidateResponse.getStatusCode());
        assertEquals(HttpStatus.CREATED, offerResponse.getStatusCode());

        long candidateId = ((Number) candidateResponse.getBody().get("id")).longValue();
        long offerId = ((Number) offerResponse.getBody().get("id")).longValue();
        var applicationResponse = restTemplate.postForEntity(baseUrl + "/api/v1/candidatures", Map.of(
                "candidateId", candidateId,
                "offerId", offerId), Map.class);

        assertEquals(HttpStatus.CREATED, applicationResponse.getStatusCode());
        assertEquals("SCORING_PENDING", applicationResponse.getBody().get("status"));
        long applicationId = ((Number) applicationResponse.getBody().get("id")).longValue();
        var persistedApplication = restTemplate.getForEntity(
                baseUrl + "/api/v1/candidatures/" + applicationId, Map.class);
        assertEquals(HttpStatus.OK, persistedApplication.getStatusCode());
        assertEquals("SCORING_PENDING", persistedApplication.getBody().get("status"));
    }
}

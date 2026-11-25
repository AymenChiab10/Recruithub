package tn.iit.recruithub.diploma.endpoint;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.soap.client.SoapFaultClientException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DiplomaSoapIntegrationTest {
    @LocalServerPort
    private int port;

    private WebServiceTemplate webServiceTemplate;

    @BeforeEach
    void setUp() throws Exception {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setClassesToBeBound(VerifyDiplomaRequest.class, VerifyDiplomaResponse.class);
        marshaller.afterPropertiesSet();
        webServiceTemplate = new WebServiceTemplate(marshaller);
    }

    @Test
    void verifiesSeededDiplomaOverSoap() {
        Object result = webServiceTemplate.marshalSendAndReceive(endpoint(),
                new VerifyDiplomaRequest("Demo Candidate", "Computer Science", "IIT", 2024));

        assertTrue(((VerifyDiplomaResponse) result).isValid());
        assertEquals("VERIFIED", ((VerifyDiplomaResponse) result).getStatus());
    }

    @Test
    void publishesTheWSDLAndItsImportedSchema() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> wsdl = client.send(HttpRequest.newBuilder(
                        URI.create("http://localhost:" + port + "/ws/diploma.wsdl")).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> schema = client.send(HttpRequest.newBuilder(
                        URI.create("http://localhost:" + port + "/ws/diplomaXsd.xsd")).GET().build(),
                HttpResponse.BodyHandlers.ofString());

        assertEquals(200, wsdl.statusCode());
        assertTrue(wsdl.body().contains("DiplomaNotFoundFault"));
        assertTrue(wsdl.body().contains("schemaLocation=\"diplomaXsd.xsd\""));
        assertEquals(200, schema.statusCode());
        assertTrue(schema.body().contains("VerifyDiplomaRequest"));
    }

    @Test
    void returnsSoapFaultForUnknownDiploma() {
        assertThrows(SoapFaultClientException.class, () -> webServiceTemplate.marshalSendAndReceive(endpoint(),
                new VerifyDiplomaRequest("Unknown Candidate", "Computer Science", "IIT", 2024)));
    }

    private String endpoint() {
        return "http://localhost:" + port + "/ws";
    }
}

package tn.iit.recruithub.recruitment.integration.soap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.ws.client.core.WebServiceTemplate;

@Component
public class SoapDiplomaClient {
    private final WebServiceTemplate webServiceTemplate;
    private final String endpoint;

    public SoapDiplomaClient(WebServiceTemplate webServiceTemplate,
                             @Value("${recruithub.diploma.url}") String endpoint) {
        this.webServiceTemplate = webServiceTemplate;
        this.endpoint = endpoint;
    }

    public VerifyDiplomaResponse verifyDiploma(VerifyDiplomaRequest request) {
        Object response = webServiceTemplate.marshalSendAndReceive(endpoint, request);
        if (!(response instanceof VerifyDiplomaResponse diplomaResponse)) {
            throw new IllegalStateException("Diploma Registry returned an unexpected SOAP response");
        }
        return diplomaResponse;
    }
}

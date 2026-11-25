package tn.iit.recruithub.diploma.endpoint;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import tn.iit.recruithub.diploma.config.WebServiceConfig;
import tn.iit.recruithub.diploma.repository.DiplomaRepository;

@Endpoint
public class DiplomaEndpoint {
    private final DiplomaRepository diplomaRepository;

    public DiplomaEndpoint(DiplomaRepository diplomaRepository) {
        this.diplomaRepository = diplomaRepository;
    }

    @PayloadRoot(namespace = WebServiceConfig.NAMESPACE_URI, localPart = "VerifyDiplomaRequest")
    @ResponsePayload
    public VerifyDiplomaResponse verifyDiploma(@RequestPayload VerifyDiplomaRequest request) {
        boolean valid = diplomaRepository.existsByHolderNameIgnoreCaseAndTitleIgnoreCaseAndInstitutionIgnoreCaseAndYear(
                request.getHolderName().trim(), request.getTitle().trim(),
                request.getInstitution().trim(), request.getYear());
        if (!valid) {
            throw new DiplomaNotFoundException("Diploma not found in the registry");
        }
        return new VerifyDiplomaResponse(true, "VERIFIED");
    }
}

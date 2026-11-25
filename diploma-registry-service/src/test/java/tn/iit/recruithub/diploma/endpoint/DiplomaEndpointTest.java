package tn.iit.recruithub.diploma.endpoint;

import org.junit.jupiter.api.Test;
import tn.iit.recruithub.diploma.repository.DiplomaRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DiplomaEndpointTest {
    @Test
    void returnsVerifiedForARegisteredDiploma() {
        DiplomaRepository repository = mock(DiplomaRepository.class);
        when(repository.existsByHolderNameIgnoreCaseAndTitleIgnoreCaseAndInstitutionIgnoreCaseAndYear(
                "Demo Candidate", "Computer Science", "IIT", 2024)).thenReturn(true);

        VerifyDiplomaResponse response = new DiplomaEndpoint(repository).verifyDiploma(
                new VerifyDiplomaRequest("Demo Candidate", "Computer Science", "IIT", 2024));

        assertTrue(response.isValid());
        assertEquals("VERIFIED", response.getStatus());
    }

    @Test
    void raisesTheSoapFaultConditionForAnUnknownDiploma() {
        DiplomaRepository repository = mock(DiplomaRepository.class);
        when(repository.existsByHolderNameIgnoreCaseAndTitleIgnoreCaseAndInstitutionIgnoreCaseAndYear(
                "Unknown Candidate", "Computer Science", "IIT", 2024)).thenReturn(false);

        assertThrows(DiplomaNotFoundException.class, () -> new DiplomaEndpoint(repository)
                .verifyDiploma(new VerifyDiplomaRequest("Unknown Candidate", "Computer Science", "IIT", 2024)));
    }
}

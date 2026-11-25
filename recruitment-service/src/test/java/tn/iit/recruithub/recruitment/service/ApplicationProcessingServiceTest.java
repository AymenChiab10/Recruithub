package tn.iit.recruithub.recruitment.service;

import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.Test;
import tn.iit.recruithub.matching.grpc.ScoreResponse;
import tn.iit.recruithub.recruitment.dto.ApplicationResponse;
import tn.iit.recruithub.recruitment.integration.RemoteDependencyException;
import tn.iit.recruithub.recruitment.integration.ResilientRemoteClients;
import tn.iit.recruithub.recruitment.model.Candidate;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.model.Offer;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApplicationProcessingServiceTest {
    @Test
    void verifiesDiplomaAndScoresBeforeReturningTheApplication() {
        ApplicationRepository repository = mock(ApplicationRepository.class);
        ResilientRemoteClients remoteClients = mock(ResilientRemoteClients.class);
        ApplicationProcessingService service = new ApplicationProcessingService(repository, remoteClients);
        JobApplication application = application();
        when(repository.findById(100L)).thenReturn(Optional.of(application));
        when(remoteClients.verifyDiploma(any())).thenReturn(
                new tn.iit.recruithub.recruitment.integration.soap.VerifyDiplomaResponse(true, "VERIFIED"));
        when(remoteClients.calculateScore(application)).thenReturn(
                ScoreResponse.newBuilder().setScore(92.5).setStatus("SCORED").build());
        when(repository.save(application)).thenReturn(application);

        ApplicationResponse response = service.process(100L);

        assertEquals("SCORED", response.status());
        assertEquals(92.5, response.score());
        assertTrue(response.diplomaVerified());
        verify(repository).save(application);
    }

    @Test
    void retainsPendingStateWhenBothRemoteServicesAreUnavailable() {
        ApplicationRepository repository = mock(ApplicationRepository.class);
        ResilientRemoteClients remoteClients = mock(ResilientRemoteClients.class);
        ApplicationProcessingService service = new ApplicationProcessingService(repository, remoteClients);
        JobApplication application = application();
        when(repository.findById(100L)).thenReturn(Optional.of(application));
        when(remoteClients.verifyDiploma(any())).thenThrow(
                new RemoteDependencyException("Registry unavailable", new IllegalStateException()));
        when(remoteClients.calculateScore(application)).thenThrow(
                new RemoteDependencyException("Matching unavailable", new StatusRuntimeException(io.grpc.Status.UNAVAILABLE)));
        when(repository.save(application)).thenReturn(application);

        ApplicationResponse response = service.process(100L);

        assertEquals("DIPLOMA_PENDING_VERIFICATION", response.status());
        assertNull(response.score());
        assertFalse(response.diplomaVerified());
        verify(repository).save(application);
    }

    private JobApplication application() {
        Candidate candidate = new Candidate();
        candidate.setId(1L);
        candidate.setFirstName("Demo");
        candidate.setLastName("Candidate");
        candidate.setDiplomaTitle("Computer Science");
        candidate.setDiplomaInstitution("IIT");
        candidate.setDiplomaYear(2024);
        Offer offer = new Offer();
        offer.setId(2L);
        JobApplication application = new JobApplication();
        application.setId(100L);
        application.setCandidate(candidate);
        application.setOffer(offer);
        return application;
    }
}

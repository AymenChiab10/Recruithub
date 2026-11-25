package tn.iit.recruithub.recruitment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ws.soap.client.SoapFaultClientException;
import tn.iit.recruithub.recruitment.dto.ApplicationResponse;
import tn.iit.recruithub.recruitment.exception.ResourceNotFoundException;
import tn.iit.recruithub.recruitment.integration.RemoteDependencyException;
import tn.iit.recruithub.recruitment.integration.ResilientRemoteClients;
import tn.iit.recruithub.recruitment.integration.soap.VerifyDiplomaRequest;
import tn.iit.recruithub.recruitment.model.Candidate;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;

@Service
public class ApplicationProcessingService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ApplicationProcessingService.class);

    private final ApplicationRepository applicationRepository;
    private final ResilientRemoteClients remoteClients;

    public ApplicationProcessingService(ApplicationRepository applicationRepository,
                                        ResilientRemoteClients remoteClients) {
        this.applicationRepository = applicationRepository;
        this.remoteClients = remoteClients;
    }

    @Transactional
    public ApplicationResponse process(Long applicationId) {
        JobApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));
        Candidate candidate = application.getCandidate();

        if (!application.isDiplomaVerificationCompleted()) {
            if (!hasDiploma(candidate)) {
                application.setDiplomaVerificationCompleted(true);
                application.setDiplomaVerified(false);
            } else {
                try {
                    VerifyDiplomaRequest request = new VerifyDiplomaRequest(
                            candidate.getFirstName() + " " + candidate.getLastName(),
                            candidate.getDiplomaTitle(),
                            candidate.getDiplomaInstitution(),
                            candidate.getDiplomaYear());
                    application.setDiplomaVerified(remoteClients.verifyDiploma(request).isValid());
                    application.setDiplomaVerificationCompleted(true);
                } catch (SoapFaultClientException notFound) {
                    application.setDiplomaVerificationCompleted(true);
                    application.setDiplomaVerified(false);
                } catch (RemoteDependencyException unavailable) {
                    LOGGER.warn("Diploma verification is pending for application {}", applicationId, unavailable);
                }
            }
        }

        if (!application.isScoringCompleted()) {
            try {
                var response = remoteClients.calculateScore(application);
                application.setScore(response.getScore());
                application.setScoringCompleted(true);
            } catch (RemoteDependencyException unavailable) {
                LOGGER.warn("Scoring is pending for application {}", applicationId, unavailable);
            }
        }

        application.setStatus(resolveStatus(application));
        JobApplication saved = applicationRepository.save(application);
        return new ApplicationResponse(saved.getId(), saved.getCandidate().getId(),
                saved.getOffer().getId(), saved.getStatus().name(), saved.getSubmittedAt(),
                saved.getScore(), saved.isDiplomaVerified());
    }

    private boolean hasDiploma(Candidate candidate) {
        return candidate.getDiplomaTitle() != null && !candidate.getDiplomaTitle().isBlank()
                && candidate.getDiplomaInstitution() != null && !candidate.getDiplomaInstitution().isBlank()
                && candidate.getDiplomaYear() != null;
    }

    private JobApplication.ApplicationStatus resolveStatus(JobApplication application) {
        if (!application.isDiplomaVerificationCompleted()) {
            return JobApplication.ApplicationStatus.DIPLOMA_PENDING_VERIFICATION;
        }
        if (!application.isScoringCompleted()) {
            return JobApplication.ApplicationStatus.SCORING_PENDING;
        }
        if (!application.isDiplomaVerified()) {
            return JobApplication.ApplicationStatus.DIPLOMA_NOT_FOUND;
        }
        return JobApplication.ApplicationStatus.SCORED;
    }
}

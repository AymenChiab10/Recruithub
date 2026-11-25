package tn.iit.recruithub.recruitment.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;

import java.util.List;

@Component
public class ApplicationRetryScheduler {
    private final ApplicationRepository applicationRepository;
    private final ApplicationProcessingService processingService;

    public ApplicationRetryScheduler(ApplicationRepository applicationRepository,
                                     ApplicationProcessingService processingService) {
        this.applicationRepository = applicationRepository;
        this.processingService = processingService;
    }

    @Scheduled(fixedDelayString = "${recruithub.recruitment.retry-delay-ms:30000}")
    public void retryPendingApplications() {
        List<JobApplication> pending = applicationRepository.findByStatusIn(List.of(
                JobApplication.ApplicationStatus.DIPLOMA_PENDING_VERIFICATION,
                JobApplication.ApplicationStatus.SCORING_PENDING,
                JobApplication.ApplicationStatus.RECEIVED,
                JobApplication.ApplicationStatus.PENDING));
        pending.forEach(application -> processingService.process(application.getId()));
    }
}

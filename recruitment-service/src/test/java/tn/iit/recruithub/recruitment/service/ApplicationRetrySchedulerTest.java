package tn.iit.recruithub.recruitment.service;

import org.junit.jupiter.api.Test;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class ApplicationRetrySchedulerTest {
    @Test
    void retriesOnlyDiplomaAndScoringPendingApplications() {
        ApplicationRepository repository = mock(ApplicationRepository.class);
        ApplicationProcessingService processingService = mock(ApplicationProcessingService.class);
        JobApplication diplomaPending = application(101L);
        JobApplication scoringPending = application(102L);
        List<JobApplication.ApplicationStatus> retryableStatuses = List.of(
                JobApplication.ApplicationStatus.DIPLOMA_PENDING_VERIFICATION,
                JobApplication.ApplicationStatus.SCORING_PENDING);
        when(repository.findByStatusIn(retryableStatuses))
                .thenReturn(List.of(diplomaPending, scoringPending));
        ApplicationRetryScheduler scheduler = new ApplicationRetryScheduler(repository, processingService);

        scheduler.retryPendingApplications();

        verify(repository).findByStatusIn(retryableStatuses);
        verify(processingService).process(101L);
        verify(processingService).process(102L);
        verifyNoMoreInteractions(processingService);
    }

    private JobApplication application(long id) {
        JobApplication application = new JobApplication();
        application.setId(id);
        return application;
    }
}

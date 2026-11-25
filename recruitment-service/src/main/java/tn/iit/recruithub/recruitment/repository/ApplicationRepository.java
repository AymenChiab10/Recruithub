package tn.iit.recruithub.recruitment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.iit.recruithub.recruitment.model.JobApplication;

import java.util.List;
import java.util.Optional;
import tn.iit.recruithub.recruitment.model.JobApplication.ApplicationStatus;

public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByOfferId(Long offerId);
    Optional<JobApplication> findByCandidateIdAndOfferId(Long candidateId, Long offerId);
    List<JobApplication> findByStatusIn(List<ApplicationStatus> statuses);
}

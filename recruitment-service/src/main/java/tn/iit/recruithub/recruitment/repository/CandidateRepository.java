package tn.iit.recruithub.recruitment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.iit.recruithub.recruitment.model.Candidate;

import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByEmail(String email);
}

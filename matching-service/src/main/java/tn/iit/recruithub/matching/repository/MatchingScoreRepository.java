package tn.iit.recruithub.matching.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.iit.recruithub.matching.model.MatchingScore;

import java.util.List;
import java.util.Optional;

public interface MatchingScoreRepository extends JpaRepository<MatchingScore, Long> {
    Optional<MatchingScore> findByApplicationId(long applicationId);
    List<MatchingScore> findByOfferIdOrderByScoreDesc(long offerId);
}

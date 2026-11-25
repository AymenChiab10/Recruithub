package tn.iit.recruithub.matching.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "matching_scores", uniqueConstraints = @UniqueConstraint(columnNames = "application_id"))
public class MatchingScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private long applicationId;

    @Column(name = "candidate_id", nullable = false)
    private long candidateId;

    @Column(name = "offer_id", nullable = false)
    private long offerId;

    @Column(nullable = false)
    private double score;

    protected MatchingScore() {
    }

    public MatchingScore(long applicationId, long candidateId, long offerId, double score) {
        this.applicationId = applicationId;
        this.candidateId = candidateId;
        this.offerId = offerId;
        this.score = score;
    }

    public long getApplicationId() { return applicationId; }
    public long getCandidateId() { return candidateId; }
    public long getOfferId() { return offerId; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
}

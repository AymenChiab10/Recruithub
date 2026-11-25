package tn.iit.recruithub.recruitment.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(name = "applications", uniqueConstraints = @UniqueConstraint(
        columnNames = {"candidate_id", "offer_id"}))
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Offer offer;

    private Instant submittedAt = Instant.now();

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status = ApplicationStatus.RECEIVED;

    private Double score;

    private boolean diplomaVerificationCompleted;

    private boolean diplomaVerified;

    private boolean scoringCompleted;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }
    public Offer getOffer() { return offer; }
    public void setOffer(Offer offer) { this.offer = offer; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public boolean isDiplomaVerificationCompleted() { return diplomaVerificationCompleted; }
    public void setDiplomaVerificationCompleted(boolean diplomaVerificationCompleted) {
        this.diplomaVerificationCompleted = diplomaVerificationCompleted;
    }
    public boolean isDiplomaVerified() { return diplomaVerified; }
    public void setDiplomaVerified(boolean diplomaVerified) { this.diplomaVerified = diplomaVerified; }
    public boolean isScoringCompleted() { return scoringCompleted; }
    public void setScoringCompleted(boolean scoringCompleted) { this.scoringCompleted = scoringCompleted; }

    public enum ApplicationStatus {
        RECEIVED,
        DIPLOMA_VERIFIED,
        DIPLOMA_NOT_FOUND,
        DIPLOMA_PENDING_VERIFICATION,
        SCORING_PENDING,
        SCORED,
        ACCEPTED,
        REJECTED,
        PENDING
    }
}

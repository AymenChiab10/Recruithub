package tn.iit.recruithub.matching.grpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.iit.recruithub.matching.model.MatchingScore;
import tn.iit.recruithub.matching.repository.MatchingScoreRepository;
import tn.iit.recruithub.matching.service.ScoreCalculator;

import java.util.List;

@Service
public class MatchingGrpcService extends MatchingServiceGrpc.MatchingServiceImplBase {
    private final MatchingScoreRepository scoreRepository;
    private final ScoreCalculator scoreCalculator;

    public MatchingGrpcService(MatchingScoreRepository scoreRepository, ScoreCalculator scoreCalculator) {
        this.scoreRepository = scoreRepository;
        this.scoreCalculator = scoreCalculator;
    }

    @Override
    @Transactional
    public void calculateScore(ScoreRequest request, StreamObserver<ScoreResponse> responseObserver) {
        if (request.getApplicationId() <= 0 || request.getCandidateId() <= 0 || request.getOfferId() <= 0) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("application_id, candidate_id and offer_id must be positive")
                    .asRuntimeException());
            return;
        }
        try {
            double score = scoreCalculator.calculate(request.getCandidateSkillsList(),
                    request.getRequiredSkillsList(), request.getCandidateExperienceYears(),
                    request.getRequiredExperienceYears());
            scoreRepository.findByApplicationId(request.getApplicationId())
                    .ifPresentOrElse(existing -> existing.setScore(score),
                            () -> scoreRepository.save(new MatchingScore(request.getApplicationId(),
                                    request.getCandidateId(), request.getOfferId(), score)));
            responseObserver.onNext(ScoreResponse.newBuilder().setScore(score).setStatus("SCORED").build());
            responseObserver.onCompleted();
        } catch (RuntimeException exception) {
            responseObserver.onError(Status.INTERNAL
                    .withDescription("Unable to calculate or persist the application score")
                    .withCause(exception)
                    .asRuntimeException());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void rankApplications(RankingRequest request, StreamObserver<RankedApplication> responseObserver) {
        if (request.getOfferId() <= 0) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("offer_id must be positive")
                    .asRuntimeException());
            return;
        }
        try {
            List<MatchingScore> scores = scoreRepository.findByOfferIdOrderByScoreDesc(request.getOfferId());
            for (int index = 0; index < scores.size(); index++) {
                MatchingScore score = scores.get(index);
                responseObserver.onNext(RankedApplication.newBuilder()
                        .setApplicationId(score.getApplicationId())
                        .setScore(score.getScore())
                        .setRank(index + 1)
                        .build());
            }
            responseObserver.onCompleted();
        } catch (RuntimeException exception) {
            responseObserver.onError(Status.INTERNAL
                    .withDescription("Unable to rank applications")
                    .withCause(exception)
                    .asRuntimeException());
        }
    }
}

package tn.iit.recruithub.recruitment.integration.grpc;

import io.grpc.ManagedChannel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tn.iit.recruithub.matching.grpc.MatchingServiceGrpc;
import tn.iit.recruithub.matching.grpc.RankedApplication;
import tn.iit.recruithub.matching.grpc.RankingRequest;
import tn.iit.recruithub.matching.grpc.ScoreRequest;
import tn.iit.recruithub.matching.grpc.ScoreResponse;
import tn.iit.recruithub.recruitment.model.Candidate;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.model.Offer;

import java.util.ArrayList;
import java.util.List;

@Component
public class MatchingGrpcClient {
    private final ManagedChannel channel;
    private final long deadlineSeconds;

    public MatchingGrpcClient(ManagedChannel channel,
                              @Value("${recruithub.recruitment.remote.timeout-seconds:3}") long deadlineSeconds) {
        this.channel = channel;
        this.deadlineSeconds = deadlineSeconds;
    }

    public ScoreResponse calculateScore(JobApplication application) {
        Candidate candidate = application.getCandidate();
        Offer offer = application.getOffer();
        ScoreRequest request = ScoreRequest.newBuilder()
                .setApplicationId(application.getId())
                .setCandidateId(candidate.getId())
                .setOfferId(offer.getId())
                .addAllCandidateSkills(candidate.getSkills())
                .addAllRequiredSkills(offer.getRequiredSkills())
                .setCandidateExperienceYears(valueOrZero(candidate.getExperienceYears()))
                .setRequiredExperienceYears(valueOrZero(offer.getRequiredExperienceYears()))
                .build();
        return MatchingServiceGrpc.newBlockingStub(channel)
                .withDeadlineAfter(deadlineSeconds, java.util.concurrent.TimeUnit.SECONDS)
                .calculateScore(request);
    }

    public List<RankedApplication> rankApplications(long offerId) {
        var responses = MatchingServiceGrpc.newBlockingStub(channel)
                .withDeadlineAfter(deadlineSeconds, java.util.concurrent.TimeUnit.SECONDS)
                .rankApplications(RankingRequest.newBuilder().setOfferId(offerId).build());
        List<RankedApplication> ranked = new ArrayList<>();
        responses.forEachRemaining(ranked::add);
        return List.copyOf(ranked);
    }

    private int valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }
}

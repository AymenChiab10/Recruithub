package tn.iit.recruithub.matching.grpc;

import io.grpc.ManagedChannel;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tn.iit.recruithub.matching.model.MatchingScore;
import tn.iit.recruithub.matching.repository.MatchingScoreRepository;
import tn.iit.recruithub.matching.service.ScoreCalculator;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MatchingGrpcServiceTest {
    private final List<MatchingScore> scores = new ArrayList<>();
    private Server server;
    private ManagedChannel channel;

    @BeforeEach
    void startGrpcServer() throws IOException {
        MatchingScoreRepository repository = mock(MatchingScoreRepository.class);
        when(repository.findByApplicationId(anyLong())).thenAnswer(invocation -> {
            long applicationId = invocation.getArgument(0, Long.class);
            return scores.stream().filter(score -> score.getApplicationId() == applicationId).findFirst();
        });
        when(repository.save(any(MatchingScore.class))).thenAnswer(invocation -> {
            MatchingScore score = invocation.getArgument(0);
            scores.removeIf(existing -> existing.getApplicationId() == score.getApplicationId());
            scores.add(score);
            return score;
        });
        when(repository.findByOfferIdOrderByScoreDesc(anyLong())).thenAnswer(invocation -> {
            long offerId = invocation.getArgument(0, Long.class);
            return scores.stream()
                    .filter(score -> score.getOfferId() == offerId)
                    .sorted(Comparator.comparingDouble(MatchingScore::getScore).reversed())
                    .toList();
        });

        server = ServerBuilder.forPort(0)
                .addService(new MatchingGrpcService(repository, new ScoreCalculator()))
                .build()
                .start();
        channel = io.grpc.ManagedChannelBuilder.forAddress("localhost", server.getPort())
                .usePlaintext()
                .build();
    }

    @AfterEach
    void stopGrpcServer() {
        if (channel != null) {
            channel.shutdownNow();
        }
        if (server != null) {
            server.shutdownNow();
        }
    }

    @Test
    void calculatesAndStreamsScoresOrderedByDescendingValue() {
        var stub = MatchingServiceGrpc.newBlockingStub(channel);
        var strong = stub.calculateScore(scoreRequest(100L, List.of("Java", "Spring"), 5));
        var weak = stub.calculateScore(scoreRequest(101L, List.of("Java"), 1));

        assertEquals(100.0, strong.getScore());
        assertEquals(45.0, weak.getScore());

        List<RankedApplication> ranked = new ArrayList<>();
        stub.rankApplications(RankingRequest.newBuilder().setOfferId(20L).build())
                .forEachRemaining(ranked::add);

        assertEquals(100L, ranked.get(0).getApplicationId());
        assertEquals(1, ranked.get(0).getRank());
        assertEquals(101L, ranked.get(1).getApplicationId());
        assertEquals(2, ranked.get(1).getRank());
    }

    @Test
    void rejectsScoreRequestsWithoutPersistentApplicationIdentifiers() {
        StatusRuntimeException exception = assertThrows(StatusRuntimeException.class, () ->
                MatchingServiceGrpc.newBlockingStub(channel).calculateScore(ScoreRequest.getDefaultInstance()));

        assertEquals(Status.INVALID_ARGUMENT.getCode(), exception.getStatus().getCode());
    }

    private ScoreRequest scoreRequest(long applicationId, List<String> skills, int experience) {
        return ScoreRequest.newBuilder()
                .setApplicationId(applicationId)
                .setCandidateId(applicationId)
                .setOfferId(20L)
                .addAllCandidateSkills(skills)
                .addAllRequiredSkills(List.of("Java", "Spring"))
                .setCandidateExperienceYears(experience)
                .setRequiredExperienceYears(3)
                .build();
    }
}

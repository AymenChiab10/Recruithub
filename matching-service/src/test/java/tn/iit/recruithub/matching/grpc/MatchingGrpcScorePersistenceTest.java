package tn.iit.recruithub.matching.grpc;

import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import tn.iit.recruithub.matching.model.MatchingScore;
import tn.iit.recruithub.matching.repository.MatchingScoreRepository;
import tn.iit.recruithub.matching.service.ScoreCalculator;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
class MatchingGrpcScorePersistenceTest {
    @Autowired
    private MatchingScoreRepository scoreRepository;

    @Test
    void recalculatingAnApplicationUpdatesItsExistingScoreRow() {
        MatchingGrpcService service = new MatchingGrpcService(scoreRepository, new ScoreCalculator());
        RecordingObserver<ScoreResponse> firstCall = new RecordingObserver<>();
        RecordingObserver<ScoreResponse> retry = new RecordingObserver<>();

        service.calculateScore(scoreRequest(List.of("Java"), 1), firstCall);
        service.calculateScore(scoreRequest(List.of("Java", "Spring"), 5), retry);

        assertNull(firstCall.error);
        assertNull(retry.error);
        assertTrue(firstCall.completed);
        assertTrue(retry.completed);
        assertEquals(45.0, firstCall.value.getScore());
        assertEquals(100.0, retry.value.getScore());
        assertEquals(1L, scoreRepository.count());
        MatchingScore persisted = scoreRepository.findByApplicationId(41L).orElseThrow();
        assertEquals(100.0, persisted.getScore());
    }

    private ScoreRequest scoreRequest(List<String> skills, int experienceYears) {
        return ScoreRequest.newBuilder()
                .setApplicationId(41L)
                .setCandidateId(12L)
                .setOfferId(30L)
                .addAllCandidateSkills(skills)
                .addAllRequiredSkills(List.of("Java", "Spring"))
                .setCandidateExperienceYears(experienceYears)
                .setRequiredExperienceYears(3)
                .build();
    }

    private static final class RecordingObserver<T> implements StreamObserver<T> {
        private T value;
        private Throwable error;
        private boolean completed;

        @Override
        public void onNext(T value) {
            this.value = value;
        }

        @Override
        public void onError(Throwable error) {
            this.error = error;
        }

        @Override
        public void onCompleted() {
            completed = true;
        }
    }
}

package tn.iit.recruithub.recruitment.integration;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.ws.soap.client.SoapFaultClientException;
import tn.iit.recruithub.matching.grpc.RankedApplication;
import tn.iit.recruithub.matching.grpc.ScoreResponse;
import tn.iit.recruithub.recruitment.integration.grpc.MatchingGrpcClient;
import tn.iit.recruithub.recruitment.integration.soap.SoapDiplomaClient;
import tn.iit.recruithub.recruitment.integration.soap.VerifyDiplomaRequest;
import tn.iit.recruithub.recruitment.integration.soap.VerifyDiplomaResponse;
import tn.iit.recruithub.recruitment.model.JobApplication;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.Callable;

@Component
public class ResilientRemoteClients {
    private final SoapDiplomaClient diplomaClient;
    private final MatchingGrpcClient matchingClient;
    private final Retry diplomaRetry;
    private final Retry matchingRetry;
    private final CircuitBreaker diplomaCircuitBreaker;
    private final CircuitBreaker matchingCircuitBreaker;

    public ResilientRemoteClients(
            SoapDiplomaClient diplomaClient,
            MatchingGrpcClient matchingClient,
            @Value("${recruithub.recruitment.remote.retry-attempts:3}") int maxAttempts,
            @Value("${recruithub.recruitment.remote.retry-delay-ms:200}") long retryDelayMs) {
        this.diplomaClient = diplomaClient;
        this.matchingClient = matchingClient;
        RetryConfig retryConfig = RetryConfig.custom()
                .maxAttempts(maxAttempts)
                .waitDuration(Duration.ofMillis(retryDelayMs))
                .retryExceptions(Exception.class)
                .ignoreExceptions(SoapFaultClientException.class)
                .build();
        CircuitBreakerConfig circuitBreakerConfig = CircuitBreakerConfig.custom()
                .slidingWindowSize(10)
                .minimumNumberOfCalls(5)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(10))
                .ignoreExceptions(SoapFaultClientException.class)
                .build();
        diplomaRetry = Retry.of("diploma-registry", retryConfig);
        matchingRetry = Retry.of("matching-service", retryConfig);
        diplomaCircuitBreaker = CircuitBreaker.of("diploma-registry", circuitBreakerConfig);
        matchingCircuitBreaker = CircuitBreaker.of("matching-service", circuitBreakerConfig);
    }

    public VerifyDiplomaResponse verifyDiploma(VerifyDiplomaRequest request) {
        try {
            return diplomaCircuitBreaker.executeCallable(
                    () -> diplomaRetry.executeCallable(() -> diplomaClient.verifyDiploma(request)));
        } catch (SoapFaultClientException businessFault) {
            throw businessFault;
        } catch (Exception exception) {
            throw new RemoteDependencyException("Diploma Registry is unavailable", exception);
        }
    }

    public ScoreResponse calculateScore(JobApplication application) {
        return executeMatching(() -> matchingClient.calculateScore(application));
    }

    public List<RankedApplication> rankApplications(long offerId) {
        return executeMatching(() -> matchingClient.rankApplications(offerId));
    }

    private <T> T executeMatching(Callable<T> operation) {
        try {
            return matchingCircuitBreaker.executeCallable(
                    () -> matchingRetry.executeCallable(operation));
        } catch (Exception exception) {
            throw new RemoteDependencyException("Matching Service is unavailable", exception);
        }
    }
}

package tn.iit.recruithub.recruitment.integration;

import org.junit.jupiter.api.Test;
import org.springframework.ws.soap.client.SoapFaultClientException;
import tn.iit.recruithub.recruitment.integration.grpc.MatchingGrpcClient;
import tn.iit.recruithub.recruitment.integration.soap.SoapDiplomaClient;
import tn.iit.recruithub.recruitment.integration.soap.VerifyDiplomaRequest;
import tn.iit.recruithub.recruitment.integration.soap.VerifyDiplomaResponse;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class ResilientRemoteClientsTest {
    @Test
    void doesNotRetryOrOpenTheCircuitForDiplomaNotFoundFaults() {
        SoapDiplomaClient diplomaClient = mock(SoapDiplomaClient.class);
        MatchingGrpcClient matchingClient = mock(MatchingGrpcClient.class);
        SoapFaultClientException notFound = mock(SoapFaultClientException.class);
        VerifyDiplomaRequest request = new VerifyDiplomaRequest(
                "Demo Candidate", "Computer Science", "IIT", 2024);
        ResilientRemoteClients remoteClients = new ResilientRemoteClients(
                diplomaClient, matchingClient, 3, 0);
        doThrow(notFound).when(diplomaClient).verifyDiploma(request);

        for (int attempt = 0; attempt < 5; attempt++) {
            assertSame(notFound, assertThrows(SoapFaultClientException.class,
                    () -> remoteClients.verifyDiploma(request)));
        }

        doReturn(new VerifyDiplomaResponse(true, "VERIFIED"))
                .when(diplomaClient).verifyDiploma(request);
        assertTrue(remoteClients.verifyDiploma(request).isValid());
        verify(diplomaClient, times(6)).verifyDiploma(request);
    }
}

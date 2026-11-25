package tn.iit.recruithub.recruitment.service;

import org.junit.jupiter.api.Test;
import tn.iit.recruithub.matching.grpc.RankedApplication;
import tn.iit.recruithub.recruitment.dto.RankedApplicationResponse;
import tn.iit.recruithub.recruitment.model.Offer;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;
import tn.iit.recruithub.recruitment.repository.CandidateRepository;
import tn.iit.recruithub.recruitment.repository.OfferRepository;
import tn.iit.recruithub.recruitment.integration.ResilientRemoteClients;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecruitmentServiceTest {
    @Test
    void returnsTheRankingProducedByTheMatchingService() {
        CandidateRepository candidates = mock(CandidateRepository.class);
        OfferRepository offers = mock(OfferRepository.class);
        ApplicationRepository applications = mock(ApplicationRepository.class);
        ApplicationProcessingService processing = mock(ApplicationProcessingService.class);
        ResilientRemoteClients remoteClients = mock(ResilientRemoteClients.class);
        RecruitmentService service = new RecruitmentService(candidates, offers, applications, processing, remoteClients);

        Offer offer = new Offer();
        offer.setId(10L);
        offer.setTitle("Backend Developer");
        when(offers.findById(10L)).thenReturn(Optional.of(offer));
        when(remoteClients.rankApplications(10L)).thenReturn(List.of(
                RankedApplication.newBuilder().setApplicationId(100L).setScore(100.0).setRank(1).build(),
                RankedApplication.newBuilder().setApplicationId(101L).setScore(50.0).setRank(2).build()));

        List<RankedApplicationResponse> result = service.rankApplications(10L);

        assertEquals(100L, result.get(0).applicationId());
        assertEquals(1, result.get(0).rank());
        assertEquals(100.0, result.get(0).score());
        assertEquals(101L, result.get(1).applicationId());
        assertEquals(2, result.get(1).rank());
    }
}

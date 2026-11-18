package tn.iit.recruithub.recruitment.service;

import org.junit.jupiter.api.Test;
import tn.iit.recruithub.recruitment.dto.RankedApplicationResponse;
import tn.iit.recruithub.recruitment.model.Candidate;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.model.Offer;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;
import tn.iit.recruithub.recruitment.repository.CandidateRepository;
import tn.iit.recruithub.recruitment.repository.OfferRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecruitmentServiceTest {
    @Test
    void ranksApplicationsBySkillsAndExperience() {
        CandidateRepository candidates = mock(CandidateRepository.class);
        OfferRepository offers = mock(OfferRepository.class);
        ApplicationRepository applications = mock(ApplicationRepository.class);
        RecruitmentService service = new RecruitmentService(candidates, offers, applications);

        Offer offer = new Offer();
        offer.setId(10L);
        offer.setTitle("Backend Developer");
        offer.setRequiredSkills(List.of("Java", "Spring"));
        offer.setRequiredExperienceYears(3);

        Candidate strongCandidate = candidate(1L, List.of("Java", "Spring"), 5);
        Candidate weakCandidate = candidate(2L, List.of("Java"), 1);

        JobApplication strongApplication = application(100L, strongCandidate, offer);
        JobApplication weakApplication = application(101L, weakCandidate, offer);

        when(offers.findById(10L)).thenReturn(Optional.of(offer));
        when(applications.findByOfferId(10L)).thenReturn(List.of(weakApplication, strongApplication));

        List<RankedApplicationResponse> result = service.rankApplications(10L);

        assertEquals(100L, result.get(0).applicationId());
        assertEquals(1, result.get(0).rank());
        assertEquals(100.0, result.get(0).score());
        assertEquals(101L, result.get(1).applicationId());
        assertEquals(2, result.get(1).rank());
    }

    private Candidate candidate(Long id, List<String> skills, int experience) {
        Candidate candidate = new Candidate();
        candidate.setId(id);
        candidate.setFirstName("Test");
        candidate.setLastName("Candidate");
        candidate.setEmail("candidate" + id + "@test.local");
        candidate.setSkills(skills);
        candidate.setExperienceYears(experience);
        return candidate;
    }

    private JobApplication application(Long id, Candidate candidate, Offer offer) {
        JobApplication application = new JobApplication();
        application.setId(id);
        application.setCandidate(candidate);
        application.setOffer(offer);
        return application;
    }
}

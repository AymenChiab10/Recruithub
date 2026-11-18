package tn.iit.recruithub.recruitment.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.iit.recruithub.recruitment.dto.ApplicationRequest;
import tn.iit.recruithub.recruitment.dto.ApplicationResponse;
import tn.iit.recruithub.recruitment.dto.CandidateRequest;
import tn.iit.recruithub.recruitment.dto.CandidateResponse;
import tn.iit.recruithub.recruitment.dto.OfferRequest;
import tn.iit.recruithub.recruitment.dto.OfferResponse;
import tn.iit.recruithub.recruitment.dto.RankedApplicationResponse;
import tn.iit.recruithub.recruitment.exception.DuplicateResourceException;
import tn.iit.recruithub.recruitment.exception.ResourceNotFoundException;
import tn.iit.recruithub.recruitment.model.Candidate;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.model.Offer;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;
import tn.iit.recruithub.recruitment.repository.CandidateRepository;
import tn.iit.recruithub.recruitment.repository.OfferRepository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class RecruitmentService {
    private final CandidateRepository candidateRepository;
    private final OfferRepository offerRepository;
    private final ApplicationRepository applicationRepository;

    public RecruitmentService(CandidateRepository candidateRepository,
                              OfferRepository offerRepository,
                              ApplicationRepository applicationRepository) {
        this.candidateRepository = candidateRepository;
        this.offerRepository = offerRepository;
        this.applicationRepository = applicationRepository;
    }

    public CandidateResponse createCandidate(CandidateRequest request) {
        if (candidateRepository.findByEmail(request.email()).isPresent()) {
            throw new DuplicateResourceException("A candidate with this email already exists");
        }
        Candidate candidate = new Candidate();
        apply(candidate, request);
        return toCandidate(candidateRepository.save(candidate));
    }

    @Transactional(readOnly = true)
    public List<CandidateResponse> findCandidates() {
        return candidateRepository.findAll().stream().map(this::toCandidate).toList();
    }

    @Transactional(readOnly = true)
    public CandidateResponse findCandidate(Long id) {
        return toCandidate(getCandidate(id));
    }

    public CandidateResponse updateCandidate(Long id, CandidateRequest request) {
        Candidate candidate = getCandidate(id);
        candidateRepository.findByEmail(request.email())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("A candidate with this email already exists");
                });
        apply(candidate, request);
        return toCandidate(candidateRepository.save(candidate));
    }

    public void deleteCandidate(Long id) {
        candidateRepository.delete(getCandidate(id));
    }

    public OfferResponse createOffer(OfferRequest request) {
        Offer offer = new Offer();
        apply(offer, request);
        return toOffer(offerRepository.save(offer));
    }

    @Transactional(readOnly = true)
    public List<OfferResponse> findOffers() {
        return offerRepository.findAll().stream().map(this::toOffer).toList();
    }

    @Transactional(readOnly = true)
    public OfferResponse findOffer(Long id) {
        return toOffer(getOffer(id));
    }

    public OfferResponse updateOffer(Long id, OfferRequest request) {
        Offer offer = getOffer(id);
        apply(offer, request);
        return toOffer(offerRepository.save(offer));
    }

    public void deleteOffer(Long id) {
        offerRepository.delete(getOffer(id));
    }

    public ApplicationResponse createApplication(ApplicationRequest request) {
        Candidate candidate = getCandidate(request.candidateId());
        Offer offer = getOffer(request.offerId());
        applicationRepository.findByCandidateIdAndOfferId(candidate.getId(), offer.getId())
                .ifPresent(application -> {
                    throw new DuplicateResourceException("This candidate has already applied to this offer");
                });

        JobApplication application = new JobApplication();
        application.setCandidate(candidate);
        application.setOffer(offer);
        return toApplication(applicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> findApplications() {
        return applicationRepository.findAll().stream().map(this::toApplication).toList();
    }

    @Transactional(readOnly = true)
    public ApplicationResponse findApplication(Long id) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
        return toApplication(application);
    }

    public void deleteApplication(Long id) {
        JobApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
        applicationRepository.delete(application);
    }

    @Transactional(readOnly = true)
    public List<RankedApplicationResponse> rankApplications(Long offerId) {
        Offer offer = getOffer(offerId);
        List<JobApplication> applications = applicationRepository.findByOfferId(offerId);

        List<RankedApplicationResponse> ranked = new ArrayList<>();
        for (JobApplication application : applications) {
            double score = calculateScore(application.getCandidate(), offer);
            ranked.add(new RankedApplicationResponse(application.getId(), score, 0));
        }

        ranked.sort(Comparator.comparingDouble(RankedApplicationResponse::score).reversed());
        List<RankedApplicationResponse> withRanks = new ArrayList<>();
        for (int i = 0; i < ranked.size(); i++) {
            RankedApplicationResponse item = ranked.get(i);
            withRanks.add(new RankedApplicationResponse(item.applicationId(), item.score(), i + 1));
        }
        return withRanks;
    }

    private double calculateScore(Candidate candidate, Offer offer) {
        List<String> required = offer.getRequiredSkills().stream()
                .filter(skill -> skill != null && !skill.isBlank())
                .map(skill -> skill.toLowerCase(Locale.ROOT).trim())
                .toList();
        List<String> candidateSkills = candidate.getSkills().stream()
                .filter(skill -> skill != null && !skill.isBlank())
                .map(skill -> skill.toLowerCase(Locale.ROOT).trim())
                .toList();

        double skillScore = 0.0;
        if (!required.isEmpty()) {
            long matches = required.stream().filter(candidateSkills::contains).count();
            skillScore = 70.0 * matches / required.size();
        } else {
            skillScore = 70.0;
        }

        int requiredExperience = offer.getRequiredExperienceYears() == null
                ? 0 : offer.getRequiredExperienceYears();
        int candidateExperience = candidate.getExperienceYears() == null
                ? 0 : candidate.getExperienceYears();
        double experienceScore = requiredExperience == 0
                ? 30.0
                : 30.0 * Math.min(1.0, (double) candidateExperience / requiredExperience);

        return Math.round((skillScore + experienceScore) * 100.0) / 100.0;
    }

    private Candidate getCandidate(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + id));
    }

    private Offer getOffer(Long id) {
        return offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + id));
    }

    private void apply(Candidate candidate, CandidateRequest request) {
        candidate.setFirstName(request.firstName().trim());
        candidate.setLastName(request.lastName().trim());
        candidate.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        candidate.setSkills(normalize(request.skills()));
        candidate.setExperienceYears(request.experienceYears());
    }

    private void apply(Offer offer, OfferRequest request) {
        offer.setTitle(request.title().trim());
        offer.setDescription(request.description());
        offer.setRequiredSkills(normalize(request.requiredSkills()));
        offer.setRequiredExperienceYears(request.requiredExperienceYears());
    }

    private List<String> normalize(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim())
                .distinct()
                .toList();
    }

    private CandidateResponse toCandidate(Candidate candidate) {
        return new CandidateResponse(candidate.getId(), candidate.getFirstName(),
                candidate.getLastName(), candidate.getEmail(),
                List.copyOf(candidate.getSkills()), candidate.getExperienceYears());
    }

    private OfferResponse toOffer(Offer offer) {
        return new OfferResponse(offer.getId(), offer.getTitle(), offer.getDescription(),
                List.copyOf(offer.getRequiredSkills()), offer.getRequiredExperienceYears());
    }

    private ApplicationResponse toApplication(JobApplication application) {
        return new ApplicationResponse(application.getId(),
                application.getCandidate().getId(), application.getOffer().getId(),
                application.getStatus().name(), application.getSubmittedAt());
    }
}

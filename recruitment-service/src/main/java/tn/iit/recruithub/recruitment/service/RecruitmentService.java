package tn.iit.recruithub.recruitment.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.iit.recruithub.matching.grpc.RankedApplication;
import tn.iit.recruithub.recruitment.dto.ApplicationRequest;
import tn.iit.recruithub.recruitment.dto.ApplicationResponse;
import tn.iit.recruithub.recruitment.dto.CandidateRequest;
import tn.iit.recruithub.recruitment.dto.CandidateResponse;
import tn.iit.recruithub.recruitment.dto.OfferRequest;
import tn.iit.recruithub.recruitment.dto.OfferResponse;
import tn.iit.recruithub.recruitment.dto.RankedApplicationResponse;
import tn.iit.recruithub.recruitment.exception.DuplicateResourceException;
import tn.iit.recruithub.recruitment.exception.ResourceNotFoundException;
import tn.iit.recruithub.recruitment.integration.ResilientRemoteClients;
import tn.iit.recruithub.recruitment.model.Candidate;
import tn.iit.recruithub.recruitment.model.JobApplication;
import tn.iit.recruithub.recruitment.model.Offer;
import tn.iit.recruithub.recruitment.repository.ApplicationRepository;
import tn.iit.recruithub.recruitment.repository.CandidateRepository;
import tn.iit.recruithub.recruitment.repository.OfferRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class RecruitmentService {
    private final CandidateRepository candidateRepository;
    private final OfferRepository offerRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationProcessingService processingService;
    private final ResilientRemoteClients remoteClients;

    public RecruitmentService(CandidateRepository candidateRepository,
                              OfferRepository offerRepository,
                              ApplicationRepository applicationRepository,
                              ApplicationProcessingService processingService,
                              ResilientRemoteClients remoteClients) {
        this.candidateRepository = candidateRepository;
        this.offerRepository = offerRepository;
        this.applicationRepository = applicationRepository;
        this.processingService = processingService;
        this.remoteClients = remoteClients;
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
        application.setStatus(JobApplication.ApplicationStatus.RECEIVED);
        JobApplication saved = applicationRepository.save(application);
        return processingService.process(saved.getId());
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
        getOffer(offerId);
        return remoteClients.rankApplications(offerId).stream()
                .map(this::toRankedApplication)
                .toList();
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
        candidate.setDiplomaTitle(normalizeText(request.diplomaTitle()));
        candidate.setDiplomaInstitution(normalizeText(request.diplomaInstitution()));
        candidate.setDiplomaYear(request.diplomaYear());
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
                List.copyOf(candidate.getSkills()), candidate.getExperienceYears(),
                candidate.getDiplomaTitle(), candidate.getDiplomaInstitution(), candidate.getDiplomaYear());
    }

    private OfferResponse toOffer(Offer offer) {
        return new OfferResponse(offer.getId(), offer.getTitle(), offer.getDescription(),
                List.copyOf(offer.getRequiredSkills()), offer.getRequiredExperienceYears());
    }

    private ApplicationResponse toApplication(JobApplication application) {
        return new ApplicationResponse(application.getId(),
                application.getCandidate().getId(), application.getOffer().getId(),
                application.getStatus().name(), application.getSubmittedAt(),
                application.getScore(), application.isDiplomaVerified());
    }

    private RankedApplicationResponse toRankedApplication(RankedApplication application) {
        return new RankedApplicationResponse(application.getApplicationId(),
                application.getScore(), application.getRank());
    }

    private String normalizeText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

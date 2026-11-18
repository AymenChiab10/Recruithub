package tn.iit.recruithub.recruitment.web;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.iit.recruithub.recruitment.dto.ApplicationRequest;
import tn.iit.recruithub.recruitment.dto.ApplicationResponse;
import tn.iit.recruithub.recruitment.dto.CandidateRequest;
import tn.iit.recruithub.recruitment.dto.CandidateResponse;
import tn.iit.recruithub.recruitment.dto.OfferRequest;
import tn.iit.recruithub.recruitment.dto.OfferResponse;
import tn.iit.recruithub.recruitment.dto.RankedApplicationResponse;
import tn.iit.recruithub.recruitment.service.RecruitmentService;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class RecruitmentController {
    private final RecruitmentService service;

    public RecruitmentController(RecruitmentService service) {
        this.service = service;
    }

    @PostMapping("/candidates")
    @ResponseStatus(HttpStatus.CREATED)
    public CandidateResponse createCandidate(@Valid @RequestBody CandidateRequest request) {
        return service.createCandidate(request);
    }

    @GetMapping("/candidates")
    public List<CandidateResponse> getCandidates() {
        return service.findCandidates();
    }

    @GetMapping("/candidates/{id}")
    public CandidateResponse getCandidate(@PathVariable Long id) {
        return service.findCandidate(id);
    }

    @PutMapping("/candidates/{id}")
    public CandidateResponse updateCandidate(@PathVariable Long id,
                                             @Valid @RequestBody CandidateRequest request) {
        return service.updateCandidate(id, request);
    }

    @DeleteMapping("/candidates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCandidate(@PathVariable Long id) {
        service.deleteCandidate(id);
    }

    @PostMapping("/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferResponse createOffer(@Valid @RequestBody OfferRequest request) {
        return service.createOffer(request);
    }

    @GetMapping("/offers")
    public List<OfferResponse> getOffers() {
        return service.findOffers();
    }

    @GetMapping("/offers/{id}")
    public OfferResponse getOffer(@PathVariable Long id) {
        return service.findOffer(id);
    }

    @PutMapping("/offers/{id}")
    public OfferResponse updateOffer(@PathVariable Long id,
                                     @Valid @RequestBody OfferRequest request) {
        return service.updateOffer(id, request);
    }

    @DeleteMapping("/offers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOffer(@PathVariable Long id) {
        service.deleteOffer(id);
    }

    @PostMapping("/candidatures")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse createApplication(@Valid @RequestBody ApplicationRequest request) {
        return service.createApplication(request);
    }

    @GetMapping("/candidatures")
    public List<ApplicationResponse> getApplications() {
        return service.findApplications();
    }

    @GetMapping("/candidatures/{id}")
    public ApplicationResponse getApplication(@PathVariable Long id) {
        return service.findApplication(id);
    }

    @DeleteMapping("/candidatures/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApplication(@PathVariable Long id) {
        service.deleteApplication(id);
    }

    @GetMapping("/offers/{offerId}/ranking")
    public List<RankedApplicationResponse> rankApplications(@PathVariable Long offerId) {
        return service.rankApplications(offerId);
    }
}

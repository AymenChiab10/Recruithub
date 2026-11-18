package tn.iit.recruithub.recruitment.dto;

import java.util.List;

public record CandidateResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        List<String> skills,
        Integer experienceYears
) {
}

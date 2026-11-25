package tn.iit.recruithub.recruitment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record CandidateRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        List<String> skills,
        @PositiveOrZero Integer experienceYears,
        String diplomaTitle,
        String diplomaInstitution,
        @PositiveOrZero Integer diplomaYear
) {
}

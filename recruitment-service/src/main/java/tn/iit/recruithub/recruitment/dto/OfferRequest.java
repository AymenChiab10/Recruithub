package tn.iit.recruithub.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record OfferRequest(
        @NotBlank String title,
        String description,
        List<String> requiredSkills,
        @PositiveOrZero Integer requiredExperienceYears
) {
}

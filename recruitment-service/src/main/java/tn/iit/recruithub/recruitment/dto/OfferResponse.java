package tn.iit.recruithub.recruitment.dto;

import java.util.List;

public record OfferResponse(
        Long id,
        String title,
        String description,
        List<String> requiredSkills,
        Integer requiredExperienceYears
) {
}

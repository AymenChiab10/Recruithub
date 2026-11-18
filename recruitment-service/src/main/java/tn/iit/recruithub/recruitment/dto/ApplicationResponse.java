package tn.iit.recruithub.recruitment.dto;

import java.time.Instant;

public record ApplicationResponse(
        Long id,
        Long candidateId,
        Long offerId,
        String status,
        Instant submittedAt
) {
}

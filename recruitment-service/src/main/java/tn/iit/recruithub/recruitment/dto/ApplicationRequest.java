package tn.iit.recruithub.recruitment.dto;

import jakarta.validation.constraints.NotNull;

public record ApplicationRequest(
        @NotNull Long candidateId,
        @NotNull Long offerId
) {
}

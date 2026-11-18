package tn.iit.recruithub.recruitment.dto;

public record RankedApplicationResponse(
        Long applicationId,
        double score,
        int rank
) {
}

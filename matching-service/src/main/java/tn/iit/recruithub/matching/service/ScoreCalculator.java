package tn.iit.recruithub.matching.service;

import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Component
public class ScoreCalculator {
    public double calculate(Iterable<String> candidateSkills, Iterable<String> requiredSkills,
                            int candidateExperienceYears, int requiredExperienceYears) {
        Set<String> normalizedCandidateSkills = normalize(candidateSkills);
        Set<String> normalizedRequiredSkills = normalize(requiredSkills);

        double skillScore = normalizedRequiredSkills.isEmpty()
                ? 70.0
                : 70.0 * normalizedRequiredSkills.stream().filter(normalizedCandidateSkills::contains).count()
                / normalizedRequiredSkills.size();
        double experienceScore = requiredExperienceYears <= 0
                ? 30.0
                : 30.0 * Math.min(1.0, Math.max(0, candidateExperienceYears) / (double) requiredExperienceYears);
        return Math.round((skillScore + experienceScore) * 100.0) / 100.0;
    }

    private Set<String> normalize(Iterable<String> values) {
        Set<String> normalized = new HashSet<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                normalized.add(value.trim().toLowerCase(Locale.ROOT));
            }
        }
        return normalized;
    }
}

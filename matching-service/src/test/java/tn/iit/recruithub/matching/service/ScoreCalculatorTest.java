package tn.iit.recruithub.matching.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ScoreCalculatorTest {
    private final ScoreCalculator calculator = new ScoreCalculator();

    @Test
    void scoresSkillsCaseInsensitivelyAndCapsExperienceContribution() {
        assertEquals(100.0, calculator.calculate(
                List.of("JAVA", "Spring"), List.of("Java", "spring"), 8, 3));
    }

    @Test
    void givesFullContributionWhenNoRequirementsAreSpecified() {
        assertEquals(100.0, calculator.calculate(List.of(), List.of(), 0, 0));
    }
}

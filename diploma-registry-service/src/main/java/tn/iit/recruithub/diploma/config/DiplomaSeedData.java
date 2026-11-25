package tn.iit.recruithub.diploma.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tn.iit.recruithub.diploma.model.RegisteredDiploma;
import tn.iit.recruithub.diploma.repository.DiplomaRepository;

@Configuration
public class DiplomaSeedData {
    @Bean
    @ConditionalOnProperty(name = "recruithub.diploma.seed-data", havingValue = "true", matchIfMissing = true)
    public CommandLineRunner seedDiplomas(DiplomaRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new RegisteredDiploma(
                        "Demo Candidate", "Computer Science", "IIT", 2024));
            }
        };
    }
}

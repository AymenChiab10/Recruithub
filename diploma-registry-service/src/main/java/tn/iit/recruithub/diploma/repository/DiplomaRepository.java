package tn.iit.recruithub.diploma.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.iit.recruithub.diploma.model.RegisteredDiploma;

public interface DiplomaRepository extends JpaRepository<RegisteredDiploma, Long> {
    boolean existsByHolderNameIgnoreCaseAndTitleIgnoreCaseAndInstitutionIgnoreCaseAndYear(
            String holderName, String title, String institution, int year);
}

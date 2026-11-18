package tn.iit.recruithub.recruitment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.iit.recruithub.recruitment.model.Offer;

public interface OfferRepository extends JpaRepository<Offer, Long> {
}

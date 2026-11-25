package tn.iit.recruithub.diploma.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "registered_diplomas", uniqueConstraints = @UniqueConstraint(
        columnNames = {"holder_name", "title", "institution", "graduation_year"}))
public class RegisteredDiploma {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "holder_name", nullable = false)
    private String holderName;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String institution;

    @Column(name = "graduation_year", nullable = false)
    private int year;

    protected RegisteredDiploma() {
    }

    public RegisteredDiploma(String holderName, String title, String institution, int year) {
        this.holderName = holderName;
        this.title = title;
        this.institution = institution;
        this.year = year;
    }
}

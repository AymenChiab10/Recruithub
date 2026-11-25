package tn.iit.recruithub.recruitment.integration.soap;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "VerifyDiplomaRequest", namespace = "http://recruithub.tn/diploma")
@XmlRootElement(name = "VerifyDiplomaRequest", namespace = "http://recruithub.tn/diploma")
public class VerifyDiplomaRequest {
    @XmlElement(namespace = "http://recruithub.tn/diploma", required = true)
    private String holderName;
    @XmlElement(namespace = "http://recruithub.tn/diploma", required = true)
    private String title;
    @XmlElement(namespace = "http://recruithub.tn/diploma", required = true)
    private String institution;
    @XmlElement(namespace = "http://recruithub.tn/diploma", required = true)
    private int year;

    public VerifyDiplomaRequest() {
    }

    public VerifyDiplomaRequest(String holderName, String title, String institution, int year) {
        this.holderName = holderName;
        this.title = title;
        this.institution = institution;
        this.year = year;
    }
}

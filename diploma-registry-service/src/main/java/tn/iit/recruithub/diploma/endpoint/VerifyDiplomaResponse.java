package tn.iit.recruithub.diploma.endpoint;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "VerifyDiplomaResponse", namespace = "http://recruithub.tn/diploma")
public class VerifyDiplomaResponse {
    @XmlElement(namespace = "http://recruithub.tn/diploma", required = true)
    private boolean valid;
    @XmlElement(namespace = "http://recruithub.tn/diploma", required = true)
    private String status;

    public VerifyDiplomaResponse() {
    }

    public VerifyDiplomaResponse(boolean valid, String status) {
        this.valid = valid;
        this.status = status;
    }

    public boolean isValid() { return valid; }
    public String getStatus() { return status; }
}

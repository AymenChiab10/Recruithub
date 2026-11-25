package tn.iit.recruithub.recruitment.integration.soap;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;
import org.springframework.ws.client.core.WebServiceTemplate;
import org.springframework.ws.transport.http.HttpUrlConnectionMessageSender;

import java.time.Duration;

@Configuration
public class SoapClientConfig {
    @Bean
    public Jaxb2Marshaller diplomaMarshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setClassesToBeBound(VerifyDiplomaRequest.class, VerifyDiplomaResponse.class);
        return marshaller;
    }

    @Bean
    public WebServiceTemplate diplomaWebServiceTemplate(Jaxb2Marshaller diplomaMarshaller) {
        HttpUrlConnectionMessageSender messageSender = new HttpUrlConnectionMessageSender();
        messageSender.setConnectionTimeout(Duration.ofSeconds(3));
        messageSender.setReadTimeout(Duration.ofSeconds(3));

        WebServiceTemplate template = new WebServiceTemplate(diplomaMarshaller);
        template.setMessageSender(messageSender);
        return template;
    }
}

package tn.iit.recruithub.diploma.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.ws.soap.SoapFault;
import org.springframework.ws.soap.SoapFaultDetailElement;
import org.springframework.ws.soap.server.endpoint.SoapFaultDefinition;
import org.springframework.ws.soap.server.endpoint.SoapFaultMappingExceptionResolver;
import org.springframework.xml.transform.StringSource;
import tn.iit.recruithub.diploma.endpoint.DiplomaNotFoundException;

import javax.xml.namespace.QName;
import javax.xml.transform.TransformerFactory;
@Configuration
public class SoapFaultConfig {
    @Bean
    public SoapFaultMappingExceptionResolver exceptionResolver() {
        SoapFaultMappingExceptionResolver resolver = new SoapFaultMappingExceptionResolver() {
            @Override
            protected SoapFaultDefinition getFaultDefinition(Object endpoint, Exception exception) {
                if (exception instanceof DiplomaNotFoundException) {
                    SoapFaultDefinition definition = new SoapFaultDefinition();
                    definition.setFaultCode(SoapFaultDefinition.CLIENT);
                    definition.setFaultStringOrReason(exception.getMessage());
                    return definition;
                }
                return super.getFaultDefinition(endpoint, exception);
            }

            @Override
            protected void customizeFault(Object endpoint, Exception exception, SoapFault fault) {
                if (exception instanceof DiplomaNotFoundException) {
                    try {
                        SoapFaultDetailElement detailElement = fault.addFaultDetail()
                                .addFaultDetailElement(new QName(
                                        WebServiceConfig.NAMESPACE_URI, "DiplomaNotFoundFault"));
                        String detail = "<diploma:message xmlns:diploma=\""
                                + WebServiceConfig.NAMESPACE_URI + "\">"
                                + escapeXml(exception.getMessage()) + "</diploma:message>";
                        TransformerFactory.newInstance().newTransformer()
                                .transform(new StringSource(detail), detailElement.getResult());
                    } catch (Exception detailException) {
                        throw new IllegalStateException("Unable to create the diploma SOAP fault detail",
                                detailException);
                    }
                }
                super.customizeFault(endpoint, exception, fault);
            }
        };
        SoapFaultDefinition defaultFault = new SoapFaultDefinition();
        defaultFault.setFaultCode(SoapFaultDefinition.SERVER);
        resolver.setDefaultFault(defaultFault);
        resolver.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return resolver;
    }

    private static String escapeXml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }
}

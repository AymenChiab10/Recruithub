package tn.iit.recruithub.recruitment.integration.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MatchingGrpcClientConfig {
    @Bean(destroyMethod = "shutdown")
    public ManagedChannel matchingChannel(
            @Value("${recruithub.matching.host:localhost}") String host,
            @Value("${recruithub.matching.grpc-port:9090}") int port) {
        return ManagedChannelBuilder.forAddress(host, port).usePlaintext().build();
    }
}

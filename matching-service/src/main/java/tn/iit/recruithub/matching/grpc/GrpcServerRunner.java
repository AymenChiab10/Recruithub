package tn.iit.recruithub.matching.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class GrpcServerRunner {
    private final MatchingGrpcService matchingGrpcService;
    private final int port;
    private Server server;

    public GrpcServerRunner(MatchingGrpcService matchingGrpcService,
                            @Value("${recruithub.matching.grpc-port:9090}") int port) {
        this.matchingGrpcService = matchingGrpcService;
        this.port = port;
    }

    @PostConstruct
    public void start() throws IOException {
        server = ServerBuilder.forPort(port).addService(matchingGrpcService).build().start();
    }

    @PreDestroy
    public void stop() {
        if (server != null) {
            server.shutdown();
        }
    }
}

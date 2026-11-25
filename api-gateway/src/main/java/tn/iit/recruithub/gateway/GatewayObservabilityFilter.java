package tn.iit.recruithub.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeoutException;

@Component
public class GatewayObservabilityFilter implements GlobalFilter, Ordered {
    private static final Logger LOGGER = LoggerFactory.getLogger(GatewayObservabilityFilter.class);
    private static final byte[] UPSTREAM_ERROR =
            "{\"error\":\"Upstream service unavailable\"}".getBytes(StandardCharsets.UTF_8);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startNanos = System.nanoTime();
        return chain.filter(exchange)
                .doOnSuccess(ignored -> LOGGER.info("{} {} -> {} in {} ms",
                        exchange.getRequest().getMethod(),
                        exchange.getRequest().getURI().getRawPath(),
                        exchange.getResponse().getStatusCode(),
                        (System.nanoTime() - startNanos) / 1_000_000))
                .onErrorResume(this::isUpstreamUnavailable, exception -> {
                    LOGGER.warn("Upstream request failed for {} {}",
                            exchange.getRequest().getMethod(),
                            exchange.getRequest().getURI().getRawPath(),
                            exception);
                    if (exchange.getResponse().isCommitted()) {
                        return Mono.error(exception);
                    }
                    exchange.getResponse().setStatusCode(HttpStatus.BAD_GATEWAY);
                    exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                    return exchange.getResponse().writeWith(Mono.just(
                            exchange.getResponse().bufferFactory().wrap(UPSTREAM_ERROR)));
                });
    }

    private boolean isUpstreamUnavailable(Throwable exception) {
        Throwable current = exception;
        while (current != null) {
            if (current instanceof WebClientRequestException
                    || current instanceof ConnectException
                    || current instanceof UnknownHostException
                    || current instanceof TimeoutException
                    || current instanceof io.netty.channel.ConnectTimeoutException
                    || current instanceof io.netty.handler.timeout.ReadTimeoutException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}

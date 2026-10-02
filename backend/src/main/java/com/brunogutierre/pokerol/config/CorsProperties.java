package com.brunogutierre.pokerol.config;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Browser origins allowed to call the API (bound from {@code app.cors.*}, e.g. the
 * {@code APP_CORS_ALLOWED_ORIGINS} environment variable as a comma-separated list).
 */
@Validated
@ConfigurationProperties("app.cors")
public record CorsProperties(@NotEmpty List<String> allowedOrigins) {
}

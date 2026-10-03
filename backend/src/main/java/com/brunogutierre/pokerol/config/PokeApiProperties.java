package com.brunogutierre.pokerol.config;

import java.net.URI;
import java.time.Duration;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Connection settings for PokeAPI (bound from {@code pokeapi.*}).
 *
 * @param baseUrl REST API root, e.g. {@code https://pokeapi.co/api/v2}
 * @param graphqlUrl GraphQL endpoint, e.g. {@code https://graphql.pokeapi.co/v1beta2}
 * @param userAgent descriptive User-Agent, as asked by the PokeAPI fair use policy
 * @param connectTimeout TCP connect timeout
 * @param readTimeout maximum wait for a response
 * @param maxRetries extra attempts after an I/O error or a 5xx response
 * @param retryBackoff pause before the first retry (doubled on each new attempt)
 */
@Validated
@ConfigurationProperties("pokeapi")
public record PokeApiProperties(@NotNull URI baseUrl, @NotNull URI graphqlUrl, @NotBlank String userAgent,
		@NotNull Duration connectTimeout, @NotNull Duration readTimeout, @Min(0) @Max(5) int maxRetries,
		@NotNull Duration retryBackoff) {
}

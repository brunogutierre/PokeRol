package com.brunogutierre.pokerol.species;

import java.time.Duration;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Species index lifecycle (bound from {@code app.index.*}).
 *
 * @param ttl age after which a full index is rebuilt in the background
 * @param degradedTtl shorter age for a degraded index, to recover quickly once GraphQL is back
 * @param warmUp load the index right after startup instead of on the first request
 */
@Validated
@ConfigurationProperties("app.index")
public record SpeciesIndexProperties(@NotNull Duration ttl, @NotNull Duration degradedTtl, boolean warmUp) {
}

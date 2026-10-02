package com.brunogutierre.pokerol.pokeapi;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import com.brunogutierre.pokerol.config.PokeApiProperties;
import org.springframework.core.io.ClassPathResource;

/** Shared fixtures for tests that talk to a mocked PokeAPI. */
public final class PokeApiTestSupport {

	public static final String BASE_URL = "https://pokeapi.test/api/v2";

	public static final String GRAPHQL_URL = "https://graphql.pokeapi.test/v1beta2";

	public static final PokeApiProperties PROPERTIES = new PokeApiProperties(URI.create(BASE_URL),
			URI.create(GRAPHQL_URL), "PokeRol (test)", Duration.ofSeconds(1), Duration.ofSeconds(1));

	private PokeApiTestSupport() {
	}

	/** Reads a recorded response from {@code src/test/resources/<path>}. */
	public static String fixture(String path) {
		try {
			return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

}

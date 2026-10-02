package com.brunogutierre.pokerol.pokeapi;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.jspecify.annotations.Nullable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.ResolvableType;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

/**
 * Minimal GraphQL-over-HTTP client for the PokeAPI GraphQL endpoint: one POST with
 * {@code {query, variables}}, then {@code data} is mapped to the requested record type.
 * Query documents live in {@code src/main/resources/graphql/*.graphql}.
 */
public class PokeApiGraphQlClient {

	private final RestClient restClient;

	public PokeApiGraphQlClient(RestClient restClient) {
		this.restClient = restClient;
	}

	/**
	 * Runs a query and returns its {@code data}.
	 * @throws PokeApiException if the response carries GraphQL errors or no data
	 */
	public <T> T query(String document, Map<String, ?> variables, Class<T> dataType) {
		ParameterizedTypeReference<Response<T>> responseType = ParameterizedTypeReference
			.forType(ResolvableType.forClassWithGenerics(Response.class, dataType).getType());
		var response = restClient.post()
			.contentType(MediaType.APPLICATION_JSON)
			.body(new Request(document, variables))
			.retrieve()
			.body(responseType);
		if (response == null || response.data() == null || !Lists.orEmpty(response.errors()).isEmpty()) {
			throw new PokeApiException("GraphQL query failed: " + errorMessages(response));
		}
		return response.data();
	}

	/** Loads the query document {@code graphql/<name>.graphql} from the classpath. */
	public static String document(String name) {
		try {
			return new ClassPathResource("graphql/" + name + ".graphql").getContentAsString(StandardCharsets.UTF_8);
		}
		catch (IOException ex) {
			throw new UncheckedIOException("GraphQL document not found: " + name, ex);
		}
	}

	private static String errorMessages(@Nullable Response<?> response) {
		if (response == null || response.errors() == null || response.errors().isEmpty()) {
			return "no data";
		}
		return response.errors().stream().map(Error::message).collect(Collectors.joining("; "));
	}

	record Request(String query, Map<String, ?> variables) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Response<T>(@Nullable T data, @Nullable List<Error> errors) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Error(String message) {
	}

}

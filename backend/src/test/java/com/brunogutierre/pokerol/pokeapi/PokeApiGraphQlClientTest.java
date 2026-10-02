package com.brunogutierre.pokerol.pokeapi;

import java.io.UncheckedIOException;
import java.util.List;
import java.util.Map;

import com.brunogutierre.pokerol.config.PokeApiClientConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.GRAPHQL_URL;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.PROPERTIES;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PokeApiGraphQlClientTest {

	MockRestServiceServer server;

	PokeApiGraphQlClient client;

	@BeforeEach
	void setUp() {
		var builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		client = PokeApiClientConfig.graphQlClient(builder, PROPERTIES);
	}

	@Test
	void postsQueryWithVariablesAndMapsData() {
		server.expect(requestTo(GRAPHQL_URL))
			.andExpect(method(HttpMethod.POST))
			.andExpect(content().json("""
					{"query":"query Colors($ids: [Int!]!) { pokemoncolor { name } }","variables":{"ids":[1,2]}}"""))
			.andRespond(withSuccess("""
					{"data":{"pokemoncolor":[{"name":"black","id":1},{"name":"blue","id":2}]}}""",
					MediaType.APPLICATION_JSON));

		var data = client.query("query Colors($ids: [Int!]!) { pokemoncolor { name } }", Map.of("ids", List.of(1, 2)),
				Colors.class);

		assertThat(data.pokemoncolor()).extracting(Color::name).containsExactly("black", "blue");
		server.verify();
	}

	@Test
	void failsOnGraphQlErrors() {
		server.expect(requestTo(GRAPHQL_URL)).andRespond(withSuccess("""
				{"errors":[{"message":"field 'x' not found"},{"message":"rate limited"}]}""",
				MediaType.APPLICATION_JSON));

		assertThatExceptionOfType(PokeApiException.class)
			.isThrownBy(() -> client.query("{ x }", Map.of(), Colors.class))
			.withMessage("GraphQL query failed: field 'x' not found; rate limited");
	}

	@Test
	void failsWhenDataIsMissing() {
		server.expect(requestTo(GRAPHQL_URL)).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

		assertThatExceptionOfType(PokeApiException.class)
			.isThrownBy(() -> client.query("{ x }", Map.of(), Colors.class))
			.withMessage("GraphQL query failed: no data");
	}

	@Test
	void reportsMissingDocument() {
		assertThatExceptionOfType(UncheckedIOException.class)
			.isThrownBy(() -> PokeApiGraphQlClient.document("missing"))
			.withMessage("GraphQL document not found: missing");
	}

	record Colors(List<Color> pokemoncolor) {
	}

	record Color(String name) {
	}

}

package com.brunogutierre.pokerol.species;

import com.brunogutierre.pokerol.config.PokeApiClientConfig;
import com.brunogutierre.pokerol.i18n.Lang;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.BASE_URL;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.GRAPHQL_URL;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.PROPERTIES;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.fixture;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.test.web.client.ExpectedCount.times;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class SpeciesIndexLoaderTest {

	MockRestServiceServer graphQlServer;

	MockRestServiceServer restServer;

	SpeciesIndexLoader loader;

	@BeforeEach
	void setUp() {
		var graphQlBuilder = RestClient.builder();
		graphQlServer = MockRestServiceServer.bindTo(graphQlBuilder).build();
		var restBuilder = RestClient.builder();
		restServer = MockRestServiceServer.bindTo(restBuilder).build();
		loader = new SpeciesIndexLoader(PokeApiClientConfig.graphQlClient(graphQlBuilder, PROPERTIES),
				PokeApiClientConfig.restClient(restBuilder, PROPERTIES));
	}

	@Test
	void buildsIndexFromTwoGraphQlQueries() {
		graphQlServer.expect(requestTo(GRAPHQL_URL))
			.andExpect(jsonPath("$.query").value(containsString("query SpeciesIndex")))
			.andExpect(jsonPath("$.variables.languages").value(contains("en", "pt-br", "fr", "es")))
			.andRespond(withSuccess(fixture("graphql/species-index.json"), MediaType.APPLICATION_JSON));
		graphQlServer.expect(requestTo(GRAPHQL_URL))
			.andExpect(jsonPath("$.query").value(containsString("query Lookups")))
			.andRespond(withSuccess(fixture("graphql/lookups.json"), MediaType.APPLICATION_JSON));

		var index = loader.load();

		assertThat(index.degraded()).isFalse();
		assertThat(index.species()).extracting(SpeciesEntry::id).containsExactly(1, 4, 25, 26, 133, 172);
		var bulbasaur = index.find(1).orElseThrow();
		assertThat(bulbasaur.name(Lang.FR)).isEqualTo("Bulbizarre");
		assertThat(bulbasaur.name(Lang.PT_BR)).isEqualTo("Bulbasaur");
		assertThat(bulbasaur.color()).isEqualTo("green");
		assertThat(bulbasaur.types()).containsExactly("grass", "poison");
		assertThat(bulbasaur.abilities()).as("hidden abilities are left out").containsExactly("overgrow");
		var lookups = index.lookups();
		assertThat(lookups.types().keys()).hasSize(18).startsWith("normal", "fighting").doesNotContain("stellar");
		assertThat(lookups.types().label("fire", Lang.FR).name()).isEqualTo("Feu");
		assertThat(lookups.stats().name("hp", Lang.ES)).isEqualTo("PS");
		assertThat(lookups.abilities().name("overgrow", Lang.PT_BR)).isEqualTo("Overgrow");
		assertThat(lookups.colors().name("green", Lang.FR)).isEqualTo("Vert");
		graphQlServer.verify();
	}

	@Test
	void fallsBackToDegradedRestIndexWhenGraphQlFails() {
		graphQlServer.expect(requestTo(GRAPHQL_URL))
			.andRespond(withSuccess("{\"errors\":[{\"message\":\"rate limit\"}]}", MediaType.APPLICATION_JSON));
		restServer.expect(requestTo(BASE_URL + "/pokemon-species?limit=2000"))
			.andRespond(withSuccess(fixture("pokeapi/species-list.json"), MediaType.APPLICATION_JSON));

		var index = loader.load();

		assertThat(index.degraded()).isTrue();
		assertThat(index.species()).extracting(entry -> entry.name(Lang.FR))
			.containsExactly("bulbasaur", "ivysaur", "venusaur");
		assertThat(index.species().getFirst().types()).isEmpty();
		assertThat(index.lookups().types().keys()).hasSize(18).contains("fairy");
		assertThat(index.lookups().types().name("fire", Lang.FR)).isEqualTo("fire");
	}

	@Test
	void failsWhenRestFallbackFailsToo() {
		graphQlServer.expect(times(3), requestTo(GRAPHQL_URL)).andRespond(withServerError());
		restServer.expect(times(3), requestTo(BASE_URL + "/pokemon-species?limit=2000")).andRespond(withServerError());

		assertThatExceptionOfType(HttpServerErrorException.class).isThrownBy(loader::load);
	}

}

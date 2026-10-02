package com.brunogutierre.pokerol.pokeapi;

import com.brunogutierre.pokerol.config.PokeApiClientConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.BASE_URL;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.PROPERTIES;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.fixture;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withResourceNotFound;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PokeApiRestClientTest {

	MockRestServiceServer server;

	PokeApiRestClient client;

	@BeforeEach
	void setUp() {
		var builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		client = PokeApiClientConfig.restClient(builder, PROPERTIES);
	}

	@Test
	void mapsPokemonToSlimRecordWithDescriptiveUserAgent() {
		server.expect(requestTo(BASE_URL + "/pokemon/25"))
			.andExpect(method(HttpMethod.GET))
			.andExpect(header(HttpHeaders.USER_AGENT, "PokeRol (test)"))
			.andRespond(withSuccess(fixture("pokeapi/pokemon-25.json"), MediaType.APPLICATION_JSON));

		var pokemon = client.getPokemon(25);

		assertThat(pokemon.id()).isEqualTo(25);
		assertThat(pokemon.height()).isEqualTo(4);
		assertThat(pokemon.weight()).isEqualTo(60);
		assertThat(pokemon.species().id()).isEqualTo(25);
		assertThat(pokemon.types()).extracting(type -> type.type().name()).containsExactly("electric");
		assertThat(pokemon.abilities()).extracting(PokemonResource.Ability::hidden).containsExactly(false, true);
		assertThat(pokemon.stats().getFirst()).satisfies(stat -> {
			assertThat(stat.stat().name()).isEqualTo("hp");
			assertThat(stat.base()).isEqualTo(35);
		});
		assertThat(pokemon.sprites().other().officialArtwork().frontDefault()).endsWith("/official-artwork/25.png");
		assertThat(pokemon.sprites().other().dreamWorld().frontDefault()).endsWith("/dream-world/25.svg");
		server.verify();
	}

	@Test
	void mapsSpecies() {
		server.expect(requestTo(BASE_URL + "/pokemon-species/25"))
			.andRespond(withSuccess(fixture("pokeapi/species-25.json"), MediaType.APPLICATION_JSON));

		var species = client.getSpecies(25);

		assertThat(species.names()).extracting(SpeciesResource.Name::name).contains("Pikachu");
		assertThat(species.genera()).extracting(SpeciesResource.Genus::genus).contains("Mouse Pokémon");
		assertThat(species.flavorTexts()).isNotEmpty();
		assertThat(species.color().name()).isEqualTo("yellow");
		assertThat(species.evolutionChain().id()).isEqualTo(10);
		assertThat(species.varieties()).extracting(v -> v.pokemon().id()).containsExactly(25, 10080);
	}

	@Test
	void mapsEvolutionChainTree() {
		server.expect(requestTo(BASE_URL + "/evolution-chain/10"))
			.andRespond(withSuccess(fixture("pokeapi/evolution-chain-10.json"), MediaType.APPLICATION_JSON));

		var chain = client.getEvolutionChain(10).chain();

		assertThat(chain.species().name()).isEqualTo("pichu");
		assertThat(chain.evolvesTo()).singleElement()
			.satisfies(pikachu -> assertThat(pikachu.evolvesTo()).extracting(link -> link.species().id())
				.containsExactly(26));
	}

	@Test
	void listsSpeciesAndTypeMembers() {
		server.expect(requestTo(BASE_URL + "/pokemon-species?limit=2000"))
			.andRespond(withSuccess(fixture("pokeapi/species-list.json"), MediaType.APPLICATION_JSON));
		server.expect(requestTo(BASE_URL + "/type/electric"))
			.andRespond(withSuccess(fixture("pokeapi/type-electric.json"), MediaType.APPLICATION_JSON));

		assertThat(client.listSpecies(2000).results()).extracting(NamedResource::id).containsExactly(1, 2, 3);
		assertThat(client.getType("electric").pokemon()).extracting(member -> member.pokemon().id())
			.contains(25, 10008);
	}

	@Test
	void propagatesNotFoundWithoutRetrying() {
		server.expect(once(), requestTo(BASE_URL + "/pokemon/99999")).andRespond(withResourceNotFound());

		assertThatExceptionOfType(HttpClientErrorException.NotFound.class).isThrownBy(() -> client.getPokemon(99999));
		server.verify();
	}

}

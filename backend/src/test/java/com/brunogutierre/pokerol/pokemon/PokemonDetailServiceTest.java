package com.brunogutierre.pokerol.pokemon;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.brunogutierre.pokerol.config.PokeApiClientConfig;
import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Ability;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Biology;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.EvolutionNode;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Images;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Stat;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Variety;
import com.brunogutierre.pokerol.species.SpeciesFixtures;
import com.brunogutierre.pokerol.species.SpeciesIndexProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.BASE_URL;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.PROPERTIES;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.fixture;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.client.ExpectedCount.manyTimes;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withResourceNotFound;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PokemonDetailServiceTest {

	static final String SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

	final SpeciesIndexProvider indexProvider = mock();

	final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

	MockRestServiceServer server;

	PokemonDetailService service;

	@BeforeEach
	void setUp() {
		given(indexProvider.get()).willReturn(SpeciesFixtures.index());
		var builder = RestClient.builder();
		// Pokémon and species are fetched in parallel: their order is not deterministic.
		server = MockRestServiceServer.bindTo(builder).ignoreExpectOrder(true).build();
		service = new PokemonDetailService(PokeApiClientConfig.restClient(builder, PROPERTIES), indexProvider,
				executor);
	}

	@AfterEach
	void tearDown() {
		executor.close();
	}

	void respond(String path, String body) {
		server.expect(requestTo(BASE_URL + path)).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
	}

	void respondPikachu() {
		respond("/pokemon/25", fixture("pokeapi/pokemon-25.json"));
		respond("/pokemon-species/25", fixture("pokeapi/species-25.json"));
		respond("/evolution-chain/10", fixture("pokeapi/evolution-chain-10.json"));
	}

	@Test
	void assemblesLocalizedDetail() {
		respondPikachu();

		var detail = service.getDetail(25, Lang.FR);

		assertThat(detail.id()).isEqualTo(25);
		assertThat(detail.speciesId()).isEqualTo(25);
		assertThat(detail.name()).isEqualTo("Pikachu");
		assertThat(detail.genus()).isEqualTo("Pokémon Souris");
		assertThat(detail.flavorTexts()).containsExactly(
				"Il lui arrive de remettre d’aplomb un Pikachu allié en lui envoyant une décharge électrique.",
				"Il élève sa queue pour surveiller les environs. Elle attire souvent la foudre dans cette position.");
		assertThat(detail.types()).containsExactly(new Label("electric", "Électrik"));
		assertThat(detail.images()).isEqualTo(new Images(
				SPRITES + "other/dream-world/25.svg", SPRITES + "other/official-artwork/25.png", SPRITES + "25.png"));
		assertThat(detail.stats()).hasSize(6)
			.startsWith(new Stat("hp", "PV", 35, 0))
			.endsWith(new Stat("speed", "Vitesse", 90, 2));
		assertThat(detail.abilities()).containsExactly(new Ability("static", "Statik", false),
				new Ability("lightning-rod", "Paratonnerre", true));
		assertThat(detail.biology()).isEqualTo(new Biology(0.4, 6.0, new Label("yellow", "Jaune"),
				new Label("quadruped", "Quadrupède"), new Label("forest", "forêts")));
		assertThat(detail.evolution()).isEqualTo(new EvolutionNode(172, "Pichu", SPRITES + "172.png",
				List.of(new EvolutionNode(25, "Pikachu", SPRITES + "25.png",
						List.of(new EvolutionNode(26, "Raichu", SPRITES + "26.png", List.of()))))));
		assertThat(detail.varieties()).containsExactly(new Variety(25, "pikachu", true, SPRITES + "25.png"),
				new Variety(10080, "pikachu-rock-star", false, SPRITES + "10080.png"));
		assertThat(detail.prevId()).isEqualTo(4);
		assertThat(detail.nextId()).isEqualTo(26);
		assertThat(detail.fallbackLanguage()).isFalse();
		server.verify();
	}

	@Test
	void fallsBackToEnglishForSparseLanguages() {
		respondPikachu();

		var detail = service.getDetail(25, Lang.PT_BR);

		assertThat(detail.genus()).isEqualTo("Mouse Pokémon");
		assertThat(detail.flavorTexts()).hasSize(2)
			.first()
			.isEqualTo("When several of these POKéMON gather, their electricity could build and cause lightning storms.");
		assertThat(detail.types()).containsExactly(new Label("electric", "Electric"));
		assertThat(detail.fallbackLanguage()).isTrue();
	}

	@Test
	void loadsSpeciesOfAVarietyAfterThePokemon() {
		respond("/pokemon/10080", fixture("pokeapi/pokemon-25.json").replace("\"id\": 25,", "\"id\": 10080,"));
		respond("/pokemon-species/25", fixture("pokeapi/species-25.json"));
		respond("/evolution-chain/10", fixture("pokeapi/evolution-chain-10.json"));

		var detail = service.getDetail(10080, Lang.EN);

		assertThat(detail.id()).isEqualTo(10080);
		assertThat(detail.speciesId()).isEqualTo(25);
		assertThat(detail.prevId()).isEqualTo(4);
		server.verify();
	}

	@Test
	void propagatesUnknownPokemon() {
		server.expect(manyTimes(), requestTo(BASE_URL + "/pokemon/9999")).andRespond(withResourceNotFound());
		server.expect(manyTimes(), requestTo(BASE_URL + "/pokemon-species/9999")).andRespond(withResourceNotFound());

		assertThatExceptionOfType(HttpClientErrorException.NotFound.class)
			.isThrownBy(() -> service.getDetail(9999, Lang.EN));
	}

	@Test
	void normalizesGameTextLineBreaks() {
		assertThat(PokemonDetailService.normalize(" When several\nof these\fPOKéMON elec­\ntricity \n"))
			.isEqualTo("When several of these POKéMON electricity");
	}

	@Test
	void reportsIndexDegradation() {
		assertThat(service.indexDegraded()).isFalse();
	}

}

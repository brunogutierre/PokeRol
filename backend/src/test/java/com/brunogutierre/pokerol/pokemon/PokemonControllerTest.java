package com.brunogutierre.pokerol.pokemon;

import java.util.List;

import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Ability;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Biology;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.EvolutionNode;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Images;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Stat;
import com.brunogutierre.pokerol.pokemon.PokemonDetail.Variety;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.client.HttpClientErrorException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@WebMvcTest(PokemonController.class)
class PokemonControllerTest {

	static final PokemonDetail VENUSAUR_MEGA = new PokemonDetail(10033, 3, "Florizarre", "Pokémon Graine",
			List.of("Une belle fleur."), List.of(new Label("grass", "Plante")), new Images(null, "artwork.png", null),
			List.of(new Stat("hp", "PV", 80, 0)), List.of(new Ability("thick-fat", "Isograisse", false)),
			new Biology(2.4, 155.5, new Label("green", "Vert"), null, null),
			new EvolutionNode(1, "Bulbizarre", "1.png", List.of()),
			List.of(new Variety(3, "venusaur", true, "3.png"), new Variety(10033, "venusaur-mega", false, "10033.png")),
			2, 4, false);

	@Autowired
	MockMvcTester mvc;

	@MockitoBean
	PokemonDetailService service;

	@Test
	void returnsDetailMatchingTheApiContract() {
		given(service.getDetail(10033, Lang.FR)).willReturn(VENUSAUR_MEGA);

		assertThat(mvc.get().uri("/api/v1/pokemon/10033?lang=fr")).hasStatusOk()
			.hasHeader(HttpHeaders.CACHE_CONTROL, "max-age=3600, public")
			.bodyJson()
			.isStrictlyEqualTo("""
					{"id":10033,"speciesId":3,"name":"Florizarre","genus":"Pokémon Graine",
					 "flavorTexts":["Une belle fleur."],"types":[{"key":"grass","name":"Plante"}],
					 "images":{"dreamWorld":null,"artwork":"artwork.png","sprite":null},
					 "stats":[{"key":"hp","name":"PV","base":80,"effort":0}],
					 "abilities":[{"key":"thick-fat","name":"Isograisse","hidden":false}],
					 "biology":{"heightM":2.4,"weightKg":155.5,"color":{"key":"green","name":"Vert"},
					            "shape":null,"habitat":null},
					 "evolution":{"id":1,"name":"Bulbizarre","spriteUrl":"1.png","children":[]},
					 "varieties":[{"pokemonId":3,"name":"venusaur","isDefault":true,"spriteUrl":"3.png"},
					              {"pokemonId":10033,"name":"venusaur-mega","isDefault":false,"spriteUrl":"10033.png"}],
					 "prevId":2,"nextId":4,"fallbackLanguage":false}""");
	}

	@Test
	void mapsUnknownPokemonTo404() {
		given(service.getDetail(99999, Lang.EN))
			.willThrow(HttpClientErrorException.create(HttpStatus.NOT_FOUND, "Not Found", null, null, null));

		assertThat(mvc.get().uri("/api/v1/pokemon/99999")).hasStatus(HttpStatus.NOT_FOUND)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void explainsParameterConstraintViolations() {
		assertThat(mvc.get().uri("/api/v1/pokemon/0")).hasStatus(HttpStatus.BAD_REQUEST)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("id: must be greater than 0");
	}

	@ParameterizedTest
	@ValueSource(strings = { "/api/v1/pokemon/0", "/api/v1/pokemon/abc", "/api/v1/pokemon/1?lang=xx" })
	void rejectsInvalidRequests(String uri) {
		assertThat(mvc.get().uri(uri)).hasStatus(HttpStatus.BAD_REQUEST)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

}

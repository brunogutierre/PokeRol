package com.brunogutierre.pokerol.species;

import java.util.List;

import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@WebMvcTest(SpeciesController.class)
class SpeciesControllerTest {

	static final PokemonSummary BULBASAUR = new PokemonSummary(1, "Bulbizarre",
			List.of(new Label("grass", "Plante"), new Label("poison", "Poison")), "green",
			"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", List.of("Engrais"));

	@Autowired
	MockMvcTester mvc;

	@MockitoBean
	SpeciesQueryService service;

	@Test
	void listsSpeciesWithDefaultsAndHttpCaching() {
		var query = new SpeciesQuery(Lang.EN, null, null, SpeciesSort.NUMBER, SortDirection.ASC, 0, 18);
		given(service.search(query)).willReturn(new PokemonPage(List.of(BULBASAUR), 0, 18, 1025, 57, false));

		assertThat(mvc.get().uri("/api/v1/pokemon")).hasStatusOk()
			.hasHeader(HttpHeaders.CACHE_CONTROL, "max-age=3600, public")
			.bodyJson()
			.isEqualTo("""
					{"items":[{"id":1,"name":"Bulbizarre","types":[{"key":"grass","name":"Plante"},
					 {"key":"poison","name":"Poison"}],"color":"green",
					 "spriteUrl":"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
					 "abilities":["Engrais"]}],
					 "page":0,"size":18,"totalItems":1025,"totalPages":57,"degraded":false}""");
	}

	@Test
	void bindsAllParametersIgnoringCase() {
		var query = new SpeciesQuery(Lang.PT_BR, "bulba", "grass", SpeciesSort.NAME, SortDirection.DESC, 2, 50);
		given(service.search(query)).willReturn(new PokemonPage(List.of(), 2, 50, 0, 0, false));

		assertThat(mvc.get().uri("/api/v1/pokemon?lang=pt-br&page=2&size=50&q=bulba&type=grass&sort=Name&dir=DESC"))
			.hasStatusOk();
	}

	@Test
	void cachesDegradedResponsesBriefly() {
		given(service.search(any())).willReturn(new PokemonPage(List.of(), 0, 18, 0, 0, true));

		assertThat(mvc.get().uri("/api/v1/pokemon")).hasStatusOk()
			.hasHeader(HttpHeaders.CACHE_CONTROL, "max-age=60, public");
	}

	@ParameterizedTest
	@ValueSource(strings = { "page=-1", "size=0", "size=101", "sort=weight", "dir=up", "lang=de", "page=abc" })
	void rejectsInvalidParameters(String parameter) {
		assertThat(mvc.get().uri("/api/v1/pokemon?" + parameter)).hasStatus(HttpStatus.BAD_REQUEST)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void listsTypes() {
		given(service.types(Lang.FR)).willReturn(List.of(new Label("normal", "Normal"), new Label("fire", "Feu")));

		assertThat(mvc.get().uri("/api/v1/types?lang=fr")).hasStatusOk()
			.hasHeader(HttpHeaders.CACHE_CONTROL, "max-age=3600, public")
			.bodyJson()
			.isEqualTo("""
					[{"key":"normal","name":"Normal"},{"key":"fire","name":"Feu"}]""");
	}

	@Test
	void allowsCrossOriginGetFromFrontend() {
		given(service.types(Lang.EN)).willReturn(List.of());

		assertThat(mvc.get().uri("/api/v1/types").header(HttpHeaders.ORIGIN, "http://localhost:4200")).hasStatusOk()
			.hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4200");
		assertThat(mvc.options()
			.uri("/api/v1/types")
			.header(HttpHeaders.ORIGIN, "http://localhost:4200")
			.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "DELETE")).hasStatus(HttpStatus.FORBIDDEN);
	}

}

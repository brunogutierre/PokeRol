package com.brunogutierre.pokerol.pokemon;

import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.pokeapi.PokeApiRestClient;
import com.brunogutierre.pokerol.species.SpeciesFixtures;
import com.brunogutierre.pokerol.species.SpeciesIndexProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.ResourceAccessException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.times;

/** Checks the {@code @Cacheable} wiring: cache key (id, lang) and no caching of degraded data. */
@SpringBootTest
class PokemonDetailCachingTest {

	@Autowired
	PokemonDetailService service;

	@MockitoBean
	PokeApiRestClient restClient;

	@MockitoBean
	SpeciesIndexProvider indexProvider;

	@Test
	void doesNotCacheFailures() {
		given(indexProvider.get()).willReturn(SpeciesFixtures.index());
		given(restClient.getPokemon(anyInt())).willThrow(new ResourceAccessException("down"));

		assertThatExceptionOfType(ResourceAccessException.class).isThrownBy(() -> service.getDetail(1, Lang.EN));
		assertThatExceptionOfType(ResourceAccessException.class).isThrownBy(() -> service.getDetail(1, Lang.EN));
		then(restClient).should(times(2)).getPokemon(1);
	}

	@Test
	void reusesCachedDetailAndSkipsCachingWhenDegraded() {
		var pokemon = PokemonDetailFixtures.pokemon();
		var species = PokemonDetailFixtures.species();
		given(restClient.getPokemon(25)).willReturn(pokemon);
		given(restClient.getSpecies(25)).willReturn(species);
		given(restClient.getEvolutionChain(10)).willReturn(PokemonDetailFixtures.chain());

		given(indexProvider.get()).willReturn(SpeciesFixtures.index());
		var first = service.getDetail(25, Lang.ES);
		assertThat(service.getDetail(25, Lang.ES)).isSameAs(first);
		service.getDetail(25, Lang.FR);
		then(restClient).should(times(2)).getPokemon(25);

		given(indexProvider.get()).willReturn(SpeciesFixtures.degradedIndex());
		service.getDetail(25, Lang.EN);
		service.getDetail(25, Lang.EN);
		then(restClient).should(times(4)).getPokemon(25);
	}

}

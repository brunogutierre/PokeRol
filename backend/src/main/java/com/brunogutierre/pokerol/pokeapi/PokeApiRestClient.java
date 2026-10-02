package com.brunogutierre.pokerol.pokeapi;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

/**
 * Declarative HTTP client for the PokeAPI REST API (implemented at runtime by
 * {@code HttpServiceProxyFactory}). Errors surface as {@code RestClientException}s.
 */
@HttpExchange(accept = "application/json")
public interface PokeApiRestClient {

	@GetExchange("/pokemon/{id}")
	PokemonResource getPokemon(@PathVariable int id);

	@GetExchange("/pokemon-species/{id}")
	SpeciesResource getSpecies(@PathVariable int id);

	@GetExchange("/evolution-chain/{id}")
	EvolutionChainResource getEvolutionChain(@PathVariable int id);

	@GetExchange("/pokemon-species")
	NamedResourceList listSpecies(@RequestParam int limit);

	@GetExchange("/type/{name}")
	TypeResource getType(@PathVariable String name);

}

package com.brunogutierre.pokerol.pokemon;

import com.brunogutierre.pokerol.pokeapi.EvolutionChainResource;
import com.brunogutierre.pokerol.pokeapi.PokemonResource;
import com.brunogutierre.pokerol.pokeapi.SpeciesResource;
import tools.jackson.databind.json.JsonMapper;

import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.fixture;

/** Pikachu's recorded PokeAPI resources, already deserialized. */
final class PokemonDetailFixtures {

	private static final JsonMapper MAPPER = JsonMapper.builder().build();

	private PokemonDetailFixtures() {
	}

	static PokemonResource pokemon() {
		return MAPPER.readValue(fixture("pokeapi/pokemon-25.json"), PokemonResource.class);
	}

	static SpeciesResource species() {
		return MAPPER.readValue(fixture("pokeapi/species-25.json"), SpeciesResource.class);
	}

	static EvolutionChainResource chain() {
		return MAPPER.readValue(fixture("pokeapi/evolution-chain-10.json"), EvolutionChainResource.class);
	}

}

package com.brunogutierre.pokerol.species;

import java.util.List;
import java.util.Map;

import tools.jackson.databind.json.JsonMapper;

import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.fixture;

/**
 * Species index built from the recorded GraphQL fixtures: Bulbasaur (1), Charmander (4),
 * Pikachu (25), Raichu (26), Eevee (133) and Pichu (172).
 */
public final class SpeciesFixtures {

	private static final JsonMapper MAPPER = JsonMapper.builder().build();

	private SpeciesFixtures() {
	}

	public static SpeciesIndex index() {
		var species = data("graphql/species-index.json", GraphQlIndexData.Index.class).species();
		var lookups = data("graphql/lookups.json", GraphQlIndexData.LookupTables.class).toLookups();
		return new SpeciesIndex(species.stream().map(GraphQlIndexData.Species::toEntry).toList(), lookups, false);
	}

	/** Degraded index of the same species: identifiers only. */
	public static SpeciesIndex degradedIndex() {
		var species = index().species()
			.stream()
			.map(entry -> new SpeciesEntry(entry.id(), entry.identifier(), null, Map.of(), List.of(), List.of()))
			.toList();
		return new SpeciesIndex(species, Lookups.typesOnly(index().lookups().types()), true);
	}

	private static <T> T data(String path, Class<T> type) {
		return MAPPER.treeToValue(MAPPER.readTree(fixture(path)).get("data"), type);
	}

}

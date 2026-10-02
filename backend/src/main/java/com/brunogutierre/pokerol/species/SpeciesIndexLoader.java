package com.brunogutierre.pokerol.species;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.pokeapi.PokeApiGraphQlClient;
import com.brunogutierre.pokerol.pokeapi.PokeApiRestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Builds the {@link SpeciesIndex}: two GraphQL queries (species + lookups) when possible,
 * otherwise a degraded index from the REST species list (identifiers only).
 */
@Component
public class SpeciesIndexLoader {

	/** Upper bound for the REST species list; PokeAPI has ~1025 species. */
	static final int MAX_SPECIES = 2000;

	/** Type keys used by the degraded index (PokeAPI types that have Pokémon). */
	static final List<String> STANDARD_TYPES = List.of("normal", "fighting", "flying", "poison", "ground", "rock",
			"bug", "ghost", "steel", "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy");

	private static final Logger log = LoggerFactory.getLogger(SpeciesIndexLoader.class);

	private final PokeApiGraphQlClient graphQlClient;

	private final PokeApiRestClient restClient;

	private final String indexQuery = PokeApiGraphQlClient.document("species-index");

	private final String lookupsQuery = PokeApiGraphQlClient.document("lookups");

	public SpeciesIndexLoader(PokeApiGraphQlClient graphQlClient, PokeApiRestClient restClient) {
		this.graphQlClient = graphQlClient;
		this.restClient = restClient;
	}

	/**
	 * Loads the full index, falling back to the degraded one if GraphQL fails.
	 * @throws RuntimeException if the REST fallback fails too
	 */
	public SpeciesIndex load() {
		try {
			var index = loadFromGraphQl();
			log.info("Species index loaded from GraphQL: {} species", index.species().size());
			return index;
		}
		catch (RuntimeException ex) {
			log.warn("GraphQL species index failed, falling back to REST: {}", ex.toString());
			var index = loadFromRest();
			log.info("Degraded species index loaded from REST: {} species", index.species().size());
			return index;
		}
	}

	SpeciesIndex loadFromGraphQl() {
		Map<String, Object> variables = Map.of("languages", Lang.pokeApiCodes());
		var index = graphQlClient.query(indexQuery, variables, GraphQlIndexData.Index.class);
		var lookups = graphQlClient.query(lookupsQuery, variables, GraphQlIndexData.LookupTables.class);
		var species = index.species().stream().map(GraphQlIndexData.Species::toEntry).toList();
		return new SpeciesIndex(species, lookups.toLookups(), false);
	}

	SpeciesIndex loadFromRest() {
		var species = restClient.listSpecies(MAX_SPECIES)
			.results()
			.stream()
			.map(ref -> new SpeciesEntry(ref.id(), ref.name(), null, Map.of(), List.of(), List.of()))
			.toList();
		var types = new LinkedHashMap<String, Map<Lang, String>>();
		STANDARD_TYPES.forEach(type -> types.put(type, Map.of()));
		return new SpeciesIndex(species, Lookups.typesOnly(new LabelTable(types)), true);
	}

}

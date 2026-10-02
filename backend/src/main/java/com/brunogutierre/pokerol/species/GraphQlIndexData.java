package com.brunogutierre.pokerol.species;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.brunogutierre.pokerol.i18n.Lang;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jspecify.annotations.Nullable;

/**
 * Response shapes of {@code graphql/species-index.graphql} and {@code graphql/lookups.graphql}
 * (field names come from the GraphQL aliases), and their mapping to the index model.
 */
final class GraphQlIndexData {

	private GraphQlIndexData() {
	}

	record Index(List<Species> species) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Species(int id, String name, @Nullable Ref color, List<Name> names, List<Pokemon> pokemon) {

		SpeciesEntry toEntry() {
			var defaultPokemon = pokemon.isEmpty() ? new Pokemon(List.of(), List.of()) : pokemon.getFirst();
			var types = defaultPokemon.types().stream().map(slot -> slot.type().name()).toList();
			var abilities = defaultPokemon.abilities()
				.stream()
				.filter(slot -> !slot.hidden())
				.map(slot -> slot.ability().name())
				.distinct()
				.toList();
			return new SpeciesEntry(id, name, color == null ? null : color.name(), localized(names), types,
					abilities);
		}

	}

	record Ref(String name) {
	}

	record Name(String name, Ref language) {
	}

	record Pokemon(List<TypeSlot> types, List<AbilitySlot> abilities) {
	}

	record TypeSlot(Ref type) {
	}

	record AbilitySlot(@JsonProperty("is_hidden") boolean hidden, Ref ability) {
	}

	record LookupTables(List<Labelled> types, List<Labelled> abilities, List<Labelled> stats,
			List<Labelled> colors, List<Labelled> shapes, List<Labelled> habitats) {

		Lookups toLookups() {
			return new Lookups(table(types), table(abilities), table(stats), table(colors), table(shapes),
					table(habitats));
		}

		private static LabelTable table(List<Labelled> rows) {
			var names = new LinkedHashMap<String, Map<Lang, String>>();
			rows.forEach(row -> names.put(row.name(), localized(row.names())));
			return new LabelTable(names);
		}

	}

	record Labelled(String name, List<Name> names) {
	}

	/** Keeps the names in supported languages, keyed by {@link Lang}. */
	static Map<Lang, String> localized(List<Name> names) {
		var result = new EnumMap<Lang, String>(Lang.class);
		names.forEach(name -> Lang.fromPokeApiCode(name.language().name())
			.ifPresent(lang -> result.put(lang, name.name())));
		return result;
	}

}

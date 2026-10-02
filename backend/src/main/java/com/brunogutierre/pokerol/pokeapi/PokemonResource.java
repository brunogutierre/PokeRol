package com.brunogutierre.pokerol.pokeapi;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jspecify.annotations.Nullable;

/**
 * Slim view of {@code /pokemon/{id}}. The raw document is ~300 KB (moves, game indices...);
 * only the fields below are deserialized, everything else is skipped while streaming.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PokemonResource(int id, String name, int height, int weight, NamedResource species,
		List<Type> types, List<Ability> abilities, List<Stat> stats, @Nullable Sprites sprites) {

	public PokemonResource {
		types = Lists.orEmpty(types);
		abilities = Lists.orEmpty(abilities);
		stats = Lists.orEmpty(stats);
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Type(int slot, NamedResource type) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Ability(@JsonProperty("is_hidden") boolean hidden, int slot, NamedResource ability) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Stat(@JsonProperty("base_stat") int base, int effort, NamedResource stat) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Sprites(@JsonProperty("front_default") @Nullable String frontDefault, @Nullable Other other) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Other(@JsonProperty("dream_world") @Nullable Artwork dreamWorld,
			@JsonProperty("official-artwork") @Nullable Artwork officialArtwork) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Artwork(@JsonProperty("front_default") @Nullable String frontDefault) {
	}

}

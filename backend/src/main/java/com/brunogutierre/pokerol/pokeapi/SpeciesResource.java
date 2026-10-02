package com.brunogutierre.pokerol.pokeapi;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jspecify.annotations.Nullable;

/**
 * Slim view of {@code /pokemon-species/{id}}: localized names, genus and flavor texts,
 * biology references, evolution chain link and varieties (forms).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SpeciesResource(int id, String name, List<Name> names, List<Genus> genera,
		@JsonProperty("flavor_text_entries") List<FlavorText> flavorTexts, @Nullable NamedResource color,
		@Nullable NamedResource shape, @Nullable NamedResource habitat,
		@JsonProperty("evolution_chain") @Nullable ApiResource evolutionChain, List<Variety> varieties) {

	public SpeciesResource {
		names = Lists.orEmpty(names);
		genera = Lists.orEmpty(genera);
		flavorTexts = Lists.orEmpty(flavorTexts);
		varieties = Lists.orEmpty(varieties);
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Name(String name, NamedResource language) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Genus(String genus, NamedResource language) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record FlavorText(@JsonProperty("flavor_text") String text, NamedResource language) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Variety(@JsonProperty("is_default") boolean isDefault, NamedResource pokemon) {
	}

	/** Unnamed resource reference (only an URL), e.g. the evolution chain. */
	@JsonIgnoreProperties(ignoreUnknown = true)
	public record ApiResource(String url) {

		public int id() {
			return NamedResource.idFromUrl(url);
		}

	}

}

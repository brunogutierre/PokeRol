package com.brunogutierre.pokerol.pokemon;

import java.util.List;

import com.brunogutierre.pokerol.i18n.Label;
import org.jspecify.annotations.Nullable;

/**
 * Everything the detail page shows, already localized.
 *
 * @param id Pokémon id (a variety such as Mega Venusaur has its own id, e.g. 10033)
 * @param speciesId species id (national Pokédex number)
 * @param name localized species name
 * @param genus localized genus, e.g. "Seed Pokémon"
 * @param flavorTexts distinct Pokédex descriptions in the requested language (or English)
 * @param prevId previous species in national order, {@code null} for the first one
 * @param nextId next species in national order, {@code null} for the last one
 * @param fallbackLanguage {@code true} if English was used for name, genus or flavor texts
 */
public record PokemonDetail(int id, int speciesId, String name, @Nullable String genus, List<String> flavorTexts,
		List<Label> types, Images images, List<Stat> stats, List<Ability> abilities, Biology biology,
		@Nullable EvolutionNode evolution, List<Variety> varieties, @Nullable Integer prevId,
		@Nullable Integer nextId, boolean fallbackLanguage) {

	/** Picture URLs, any of which may be missing for newer or alternate forms. */
	public record Images(@Nullable String dreamWorld, @Nullable String artwork, @Nullable String sprite) {
	}

	public record Stat(String key, String name, int base, int effort) {
	}

	public record Ability(String key, String name, boolean hidden) {
	}

	public record Biology(double heightM, double weightKg, @Nullable Label color, @Nullable Label shape,
			@Nullable Label habitat) {
	}

	/** A species in the evolution tree; {@code id} is the species id. */
	public record EvolutionNode(int id, String name, String spriteUrl, List<EvolutionNode> children) {
	}

	/** A form of the species; {@code name} is the PokeAPI identifier, e.g. {@code venusaur-mega}. */
	public record Variety(int pokemonId, String name, boolean isDefault, String spriteUrl) {
	}

}

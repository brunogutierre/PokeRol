package com.brunogutierre.pokerol.pokemon;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.function.Function;

import com.brunogutierre.pokerol.config.CacheConfig;
import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.i18n.LocalizedText;
import com.brunogutierre.pokerol.pokeapi.EvolutionChainResource;
import com.brunogutierre.pokerol.pokeapi.NamedResource;
import com.brunogutierre.pokerol.pokeapi.PokeApiRestClient;
import com.brunogutierre.pokerol.pokeapi.PokemonResource;
import com.brunogutierre.pokerol.pokeapi.SpeciesResource;
import com.brunogutierre.pokerol.pokeapi.SpriteUrls;
import com.brunogutierre.pokerol.species.LabelTable;
import com.brunogutierre.pokerol.species.SpeciesIndex;
import com.brunogutierre.pokerol.species.SpeciesIndexProvider;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Assembles {@link PokemonDetail} from three PokeAPI resources: the Pokémon and its species
 * (fetched in parallel on virtual threads), then the evolution chain. Labels of types,
 * abilities, stats, biology and evolution species come from the in-memory index.
 */
@Service
public class PokemonDetailService {

	/** Alternate forms have ids from 10001 on; below that, Pokémon id = species id. */
	private static final int FIRST_FORM_ID = 10_001;

	private final PokeApiRestClient restClient;

	private final SpeciesIndexProvider indexProvider;

	private final ExecutorService executor;

	public PokemonDetailService(PokeApiRestClient restClient, SpeciesIndexProvider indexProvider,
			@Qualifier("pokeApiExecutor") ExecutorService executor) {
		this.restClient = restClient;
		this.indexProvider = indexProvider;
		this.executor = executor;
	}

	/** Cached per (id, lang), except while the index is degraded (labels would be identifiers). */
	@Cacheable(cacheNames = CacheConfig.POKEMON_DETAIL, key = "#id + ':' + #lang.code()",
			unless = "#root.target.indexDegraded()")
	public PokemonDetail getDetail(int id, Lang lang) {
		var index = indexProvider.get();
		var pokemonCall = executor.submit(() -> restClient.getPokemon(id));
		var speciesCall = id < FIRST_FORM_ID ? executor.submit(() -> restClient.getSpecies(id)) : null;
		try {
			var pokemon = await(pokemonCall);
			int speciesId = pokemon.species().id();
			var species = speciesCall != null && speciesId == id ? await(speciesCall) : restClient.getSpecies(speciesId);
			var chain = species.evolutionChain() == null ? null
					: restClient.getEvolutionChain(species.evolutionChain().id()).chain();
			return assemble(pokemon, species, chain, index, lang);
		}
		finally {
			if (speciesCall != null) {
				speciesCall.cancel(true);
			}
		}
	}

	public boolean indexDegraded() {
		return indexProvider.get().degraded();
	}

	private static PokemonDetail assemble(PokemonResource pokemon, SpeciesResource species,
			EvolutionChainResource.@Nullable Link chain, SpeciesIndex index, Lang lang) {
		var lookups = index.lookups();
		var name = LocalizedText.pick(byLang(species.names(), SpeciesResource.Name::language, SpeciesResource.Name::name),
				lang);
		var genus = LocalizedText
			.pick(byLang(species.genera(), SpeciesResource.Genus::language, SpeciesResource.Genus::genus), lang);
		var flavor = flavorTexts(species, lang);
		boolean fallback = name.map(LocalizedText.Pick::fallback).orElse(false)
				|| genus.map(LocalizedText.Pick::fallback).orElse(false) || flavor.fallback();
		var types = pokemon.types()
			.stream()
			.sorted(Comparator.comparingInt(PokemonResource.Type::slot))
			.map(slot -> lookups.types().label(slot.type().name(), lang))
			.toList();
		var stats = pokemon.stats()
			.stream()
			.map(stat -> new PokemonDetail.Stat(stat.stat().name(), lookups.stats().name(stat.stat().name(), lang),
					stat.base(), stat.effort()))
			.toList();
		var abilities = pokemon.abilities()
			.stream()
			.sorted(Comparator.comparingInt(PokemonResource.Ability::slot))
			.map(slot -> new PokemonDetail.Ability(slot.ability().name(),
					lookups.abilities().name(slot.ability().name(), lang), slot.hidden()))
			.toList();
		var biology = new PokemonDetail.Biology(pokemon.height() / 10.0, pokemon.weight() / 10.0,
				label(lookups.colors(), species.color(), lang), label(lookups.shapes(), species.shape(), lang),
				label(lookups.habitats(), species.habitat(), lang));
		var varieties = species.varieties()
			.stream()
			.map(variety -> new PokemonDetail.Variety(variety.pokemon().id(), variety.pokemon().name(),
					variety.isDefault(), SpriteUrls.sprite(variety.pokemon().id())))
			.toList();
		return new PokemonDetail(pokemon.id(), species.id(), name.map(LocalizedText.Pick::text).orElse(species.name()),
				genus.map(LocalizedText.Pick::text).orElse(null), flavor.texts(), types, images(pokemon), stats,
				abilities, biology, chain == null ? null : evolution(chain, index, lang), varieties,
				index.previousId(species.id()), index.nextId(species.id()), fallback);
	}

	private static PokemonDetail.Images images(PokemonResource pokemon) {
		var sprites = pokemon.sprites();
		if (sprites == null) {
			return new PokemonDetail.Images(null, null, null);
		}
		var other = sprites.other();
		var dreamWorld = other == null || other.dreamWorld() == null ? null : other.dreamWorld().frontDefault();
		var artwork = other == null || other.officialArtwork() == null ? null : other.officialArtwork().frontDefault();
		return new PokemonDetail.Images(dreamWorld, artwork, sprites.frontDefault());
	}

	private static PokemonDetail.EvolutionNode evolution(EvolutionChainResource.Link link, SpeciesIndex index,
			Lang lang) {
		int speciesId = link.species().id();
		var name = index.find(speciesId).map(entry -> entry.name(lang)).orElse(link.species().name());
		var children = link.evolvesTo().stream().map(child -> evolution(child, index, lang)).toList();
		return new PokemonDetail.EvolutionNode(speciesId, name, SpriteUrls.sprite(speciesId), children);
	}

	private static @Nullable Label label(LabelTable table, @Nullable NamedResource resource, Lang lang) {
		return resource == null ? null : table.label(resource.name(), lang);
	}

	/** Flavor texts in the requested language, or in English (flagged as fallback). */
	static FlavorTexts flavorTexts(SpeciesResource species, Lang lang) {
		var requested = flavorTexts(species, lang.pokeApiCode());
		if (!requested.isEmpty() || lang == Lang.EN) {
			return new FlavorTexts(requested, false);
		}
		var english = flavorTexts(species, Lang.EN.pokeApiCode());
		return new FlavorTexts(english, !english.isEmpty());
	}

	private static List<String> flavorTexts(SpeciesResource species, String language) {
		var texts = new LinkedHashSet<String>();
		species.flavorTexts()
			.stream()
			.filter(entry -> entry.language().name().equals(language))
			.map(entry -> normalize(entry.text()))
			.filter(text -> !text.isEmpty())
			.forEach(texts::add);
		return List.copyOf(texts);
	}

	/**
	 * Game texts keep the cartridge line breaks: newlines and form feeds become spaces, and a
	 * soft hyphen before a line break joins the word ("elec­\ntricity" → "electricity").
	 */
	static String normalize(String text) {
		return text.replace("­\n", "").replaceAll("\\s+", " ").strip();
	}

	private static <T> Map<Lang, String> byLang(List<T> items, Function<T, NamedResource> language,
			Function<T, String> text) {
		var result = new EnumMap<Lang, String>(Lang.class);
		items.forEach(item -> Lang.fromPokeApiCode(language.apply(item).name())
			.ifPresent(lang -> result.putIfAbsent(lang, text.apply(item))));
		return result;
	}

	private static <T> T await(Future<T> future) {
		try {
			return future.get();
		}
		catch (ExecutionException ex) {
			if (ex.getCause() instanceof RuntimeException cause) {
				throw cause;
			}
			throw new IllegalStateException(ex.getCause());
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new IllegalStateException("Interrupted while calling PokeAPI", ex);
		}
	}

	record FlavorTexts(List<String> texts, boolean fallback) {
	}

}

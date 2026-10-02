package com.brunogutierre.pokerol.species;

import java.text.Collator;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Predicate;
import java.util.regex.Pattern;

import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.pokeapi.SpriteUrls;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Searches, filters, sorts and pages the in-memory {@link SpeciesIndex}.
 */
@Service
public class SpeciesQueryService {

	private static final Pattern NUMBER = Pattern.compile("#?(\\d{1,5})");

	private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");

	private final SpeciesIndexProvider indexProvider;

	private final TypeMembership typeMembership;

	public SpeciesQueryService(SpeciesIndexProvider indexProvider, TypeMembership typeMembership) {
		this.indexProvider = indexProvider;
		this.typeMembership = typeMembership;
	}

	public PokemonPage search(SpeciesQuery query) {
		var index = indexProvider.get();
		var matches = index.species()
			.stream()
			.filter(matchesText(query.q(), query.lang()).and(hasType(index, query.type())))
			.sorted(comparator(query.sort(), query.dir(), query.lang()))
			.toList();
		int from = (int) Math.min((long) query.page() * query.size(), matches.size());
		int to = Math.min(from + query.size(), matches.size());
		var items = matches.subList(from, to).stream().map(entry -> summary(entry, index.lookups(), query.lang())).toList();
		int totalPages = (matches.size() + query.size() - 1) / query.size();
		return new PokemonPage(items, query.page(), query.size(), matches.size(), totalPages, index.degraded());
	}

	/** Types that have Pokémon, in PokeAPI order, with localized names. */
	public List<Label> types(Lang lang) {
		var types = indexProvider.get().lookups().types();
		return types.keys().stream().map(key -> types.label(key, lang)).toList();
	}

	/** {@code true} if the current index is the degraded REST fallback. */
	public boolean degraded() {
		return indexProvider.get().degraded();
	}

	private static Predicate<SpeciesEntry> matchesText(@Nullable String q, Lang lang) {
		if (q == null || q.isBlank()) {
			return entry -> true;
		}
		var needle = normalize(q);
		var number = NUMBER.matcher(q.strip());
		int id = number.matches() ? Integer.parseInt(number.group(1)) : -1;
		return entry -> entry.id() == id || normalize(entry.name(lang)).contains(needle)
				|| normalize(entry.name(Lang.EN)).contains(needle)
				|| normalize(entry.identifier().replace('-', ' ')).contains(needle);
	}

	private Predicate<SpeciesEntry> hasType(SpeciesIndex index, @Nullable String type) {
		if (type == null || type.isBlank()) {
			return entry -> true;
		}
		var key = type.strip().toLowerCase(Locale.ROOT);
		if (!index.lookups().types().contains(key)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown type: " + type);
		}
		if (index.degraded()) {
			var ids = typeMembership.speciesIds(key);
			return entry -> ids.contains(entry.id());
		}
		return entry -> entry.types().contains(key);
	}

	private static Comparator<SpeciesEntry> comparator(SpeciesSort sort, SortDirection dir, Lang lang) {
		Comparator<SpeciesEntry> byNumber = Comparator.comparingInt(SpeciesEntry::id);
		Comparator<SpeciesEntry> comparator = switch (sort) {
			case NUMBER -> byNumber;
			case NAME -> {
				// Collator is not thread-safe: one instance per request.
				var collator = Collator.getInstance(lang.locale());
				yield Comparator.comparing((SpeciesEntry entry) -> entry.name(lang), collator).thenComparing(byNumber);
			}
		};
		return dir == SortDirection.DESC ? comparator.reversed() : comparator;
	}

	private static PokemonSummary summary(SpeciesEntry entry, Lookups lookups, Lang lang) {
		var types = entry.types().stream().map(type -> lookups.types().label(type, lang)).toList();
		var abilities = entry.abilities().stream().map(ability -> lookups.abilities().name(ability, lang)).toList();
		return new PokemonSummary(entry.id(), entry.name(lang), types, entry.color(), SpriteUrls.sprite(entry.id()),
				abilities);
	}

	/** Lower case without accents, so "evoli" finds "Évoli" and "pokemon" finds "Pokémon". */
	static String normalize(String text) {
		return DIACRITICS.matcher(Normalizer.normalize(text.strip(), Normalizer.Form.NFD))
			.replaceAll("")
			.toLowerCase(Locale.ROOT);
	}

}

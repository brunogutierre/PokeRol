package com.brunogutierre.pokerol.species;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.jspecify.annotations.Nullable;

/**
 * Immutable in-memory index of all species (~1000 entries, a few hundred KB) plus the
 * localized reference tables. Searching, filtering, sorting and paging run against it,
 * so the list endpoint never calls PokeAPI per request.
 */
public final class SpeciesIndex {

	private final List<SpeciesEntry> species;

	private final Map<Integer, Integer> positions = new HashMap<>();

	private final Lookups lookups;

	private final boolean degraded;

	/**
	 * @param degraded {@code true} when built from the REST fallback (identifiers only, no
	 * types, colors or translations)
	 */
	public SpeciesIndex(List<SpeciesEntry> species, Lookups lookups, boolean degraded) {
		this.species = species.stream().sorted(Comparator.comparingInt(SpeciesEntry::id)).toList();
		for (int i = 0; i < this.species.size(); i++) {
			positions.put(this.species.get(i).id(), i);
		}
		this.lookups = lookups;
		this.degraded = degraded;
	}

	/** All species in national Pokédex order. */
	public List<SpeciesEntry> species() {
		return species;
	}

	public Lookups lookups() {
		return lookups;
	}

	public boolean degraded() {
		return degraded;
	}

	public Optional<SpeciesEntry> find(int speciesId) {
		var position = positions.get(speciesId);
		return position == null ? Optional.empty() : Optional.of(species.get(position));
	}

	/** Species before {@code speciesId} in national order, {@code null} at the start. */
	public @Nullable Integer previousId(int speciesId) {
		return neighbour(speciesId, -1);
	}

	/** Species after {@code speciesId} in national order, {@code null} at the end. */
	public @Nullable Integer nextId(int speciesId) {
		return neighbour(speciesId, 1);
	}

	private @Nullable Integer neighbour(int speciesId, int step) {
		var position = positions.get(speciesId);
		if (position == null || position + step < 0 || position + step >= species.size()) {
			return null;
		}
		return species.get(position + step).id();
	}

}

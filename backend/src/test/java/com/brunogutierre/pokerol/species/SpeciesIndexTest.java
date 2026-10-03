package com.brunogutierre.pokerol.species;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SpeciesIndexTest {

	static SpeciesEntry entry(int id) {
		return new SpeciesEntry(id, "species-" + id, null, Map.of(), List.of(), List.of());
	}

	final SpeciesIndex index = new SpeciesIndex(List.of(entry(3), entry(1), entry(2)),
			Lookups.typesOnly(LabelTable.EMPTY), false);

	@Test
	void keepsNationalOrder() {
		assertThat(index.species()).extracting(SpeciesEntry::id).containsExactly(1, 2, 3);
		assertThat(index.find(2)).contains(entry(2));
		assertThat(index.find(4)).isEmpty();
	}

	@Test
	void findsNeighboursWithNullAtTheEnds() {
		assertThat(index.previousId(1)).isNull();
		assertThat(index.nextId(1)).isEqualTo(2);
		assertThat(index.previousId(3)).isEqualTo(2);
		assertThat(index.nextId(3)).isNull();
		assertThat(index.nextId(99)).isNull();
	}

}

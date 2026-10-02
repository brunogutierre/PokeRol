package com.brunogutierre.pokerol.species;

/**
 * Localized labels of every reference table the API displays.
 */
public record Lookups(LabelTable types, LabelTable abilities, LabelTable stats, LabelTable colors,
		LabelTable shapes, LabelTable habitats) {

	/** Labels for the degraded index: only the type keys are known, every name is its identifier. */
	static Lookups typesOnly(LabelTable types) {
		return new Lookups(types, LabelTable.EMPTY, LabelTable.EMPTY, LabelTable.EMPTY, LabelTable.EMPTY,
				LabelTable.EMPTY);
	}

}

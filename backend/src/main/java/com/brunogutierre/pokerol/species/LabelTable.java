package com.brunogutierre.pokerol.species;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.i18n.LocalizedText;

/**
 * Localized names of a small PokeAPI reference table (types, abilities, stats...), keyed by
 * identifier and kept in PokeAPI order. Unknown keys are labelled with the identifier itself.
 */
public record LabelTable(Map<String, Map<Lang, String>> names) {

	public static final LabelTable EMPTY = new LabelTable(Map.of());

	public LabelTable {
		names = Collections.unmodifiableMap(new LinkedHashMap<>(names));
	}

	public String name(String key, Lang lang) {
		return LocalizedText.pick(names.getOrDefault(key, Map.of()), lang, key);
	}

	public Label label(String key, Lang lang) {
		return new Label(key, name(key, lang));
	}

	public boolean contains(String key) {
		return names.containsKey(key);
	}

	/** Identifiers in PokeAPI order. */
	public Set<String> keys() {
		return names.keySet();
	}

}

package com.brunogutierre.pokerol.pokeapi;

import java.util.List;

import org.jspecify.annotations.Nullable;

/** Null-safe list helpers for deserialized records (PokeAPI may omit or null arrays). */
final class Lists {

	private Lists() {
	}

	static <T> List<T> orEmpty(@Nullable List<T> list) {
		return list == null ? List.of() : List.copyOf(list);
	}

}

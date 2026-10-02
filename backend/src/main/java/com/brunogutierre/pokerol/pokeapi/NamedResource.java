package com.brunogutierre.pokerol.pokeapi;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * PokeAPI reference to another resource, e.g. {@code {"name":"pikachu","url":".../pokemon/25/"}}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record NamedResource(String name, String url) {

	/** Numeric id at the end of the resource URL. */
	public int id() {
		return idFromUrl(url);
	}

	/** Extracts the trailing numeric id of a PokeAPI resource URL ({@code .../pokemon-species/25/}). */
	public static int idFromUrl(String url) {
		var trimmed = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
		return Integer.parseInt(trimmed.substring(trimmed.lastIndexOf('/') + 1));
	}

}

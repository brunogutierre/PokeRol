package com.brunogutierre.pokerol.pokeapi;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A page of a PokeAPI resource list, e.g. {@code /pokemon-species?limit=2000}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record NamedResourceList(int count, List<NamedResource> results) {

	public NamedResourceList {
		results = Lists.orEmpty(results);
	}

}

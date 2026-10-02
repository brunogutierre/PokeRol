package com.brunogutierre.pokerol.pokeapi;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Slim view of {@code /type/{name}}: only the Pokémon that have the type.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TypeResource(String name, List<Member> pokemon) {

	public TypeResource {
		pokemon = Lists.orEmpty(pokemon);
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Member(int slot, NamedResource pokemon) {
	}

}

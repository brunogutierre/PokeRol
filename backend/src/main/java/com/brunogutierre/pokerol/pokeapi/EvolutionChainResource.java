package com.brunogutierre.pokerol.pokeapi;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Slim view of {@code /evolution-chain/{id}}: a tree of species (evolution details are skipped).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EvolutionChainResource(int id, Link chain) {

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Link(NamedResource species, @JsonProperty("evolves_to") List<Link> evolvesTo) {

		public Link {
			evolvesTo = Lists.orEmpty(evolvesTo);
		}

	}

}

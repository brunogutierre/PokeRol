package com.brunogutierre.pokerol.species;

import java.util.Set;
import java.util.stream.Collectors;

import com.brunogutierre.pokerol.config.CacheConfig;
import com.brunogutierre.pokerol.pokeapi.PokeApiRestClient;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

/**
 * Species ids of a type, from {@code /type/{name}}. Only needed by the degraded index,
 * which does not know the types of each species.
 */
@Component
public class TypeMembership {

	/** Alternate forms (megas, regional forms...) have Pokémon ids from 10001 on. */
	private static final int FIRST_FORM_ID = 10_001;

	private final PokeApiRestClient restClient;

	public TypeMembership(PokeApiRestClient restClient) {
		this.restClient = restClient;
	}

	/** Default forms share their id with the species, so their Pokémon ids are species ids. */
	@Cacheable(CacheConfig.TYPE_MEMBERS)
	public Set<Integer> speciesIds(String type) {
		return restClient.getType(type)
			.pokemon()
			.stream()
			.map(member -> member.pokemon().id())
			.filter(id -> id < FIRST_FORM_ID)
			.collect(Collectors.toUnmodifiableSet());
	}

}

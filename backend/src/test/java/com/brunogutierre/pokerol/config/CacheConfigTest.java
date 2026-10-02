package com.brunogutierre.pokerol.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CacheConfigTest {

	@Test
	void declaresOnlyKnownCaches() {
		var manager = new CacheConfig().cacheManager();

		assertThat(manager.getCacheNames()).containsExactlyInAnyOrder("pokemonDetail", "typeMembers");
		assertThat(manager.getCache("unknown")).isNull();
	}

}

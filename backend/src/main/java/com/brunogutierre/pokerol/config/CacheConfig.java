package com.brunogutierre.pokerol.config;

import java.time.Duration;
import java.util.List;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * In-process Caffeine caches, each one with its own size and expiry. Caches are declared
 * explicitly: using an unknown cache name is a startup error, not a silent unbounded cache.
 */
@Configuration(proxyBeanMethods = false)
@EnableCaching
public class CacheConfig {

	/** Species ids per type, only used by the degraded index. */
	public static final String TYPE_MEMBERS = "typeMembers";

	@Bean
	CacheManager cacheManager() {
		var manager = new CaffeineCacheManager();
		manager.setCacheNames(List.of());
		manager.setAllowNullValues(false);
		manager.registerCustomCache(TYPE_MEMBERS,
				Caffeine.newBuilder().maximumSize(32).expireAfterWrite(Duration.ofHours(1)).build());
		return manager;
	}

}

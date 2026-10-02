package com.brunogutierre.pokerol.web;

import java.time.Duration;

import org.springframework.http.CacheControl;

/**
 * HTTP caching of API responses. PokeAPI data is practically static, so browsers and CDNs
 * may keep responses for an hour; degraded responses only for a minute.
 */
public final class ApiCaching {

	private ApiCaching() {
	}

	public static CacheControl cacheControl(boolean degraded) {
		return CacheControl.maxAge(degraded ? Duration.ofMinutes(1) : Duration.ofHours(1)).cachePublic();
	}

}

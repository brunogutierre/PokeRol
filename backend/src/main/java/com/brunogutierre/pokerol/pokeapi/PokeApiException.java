package com.brunogutierre.pokerol.pokeapi;

/**
 * PokeAPI answered, but not with usable data (e.g. GraphQL errors in a 200 response).
 * Transport and HTTP status failures are reported as {@code RestClientException}s instead.
 */
public class PokeApiException extends RuntimeException {

	public PokeApiException(String message) {
		super(message);
	}

}

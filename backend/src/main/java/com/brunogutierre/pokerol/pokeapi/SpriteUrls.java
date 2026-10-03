package com.brunogutierre.pokerol.pokeapi;

/**
 * Sprite URLs of the PokeAPI sprites repository, computed from the Pokémon id without any call.
 */
public final class SpriteUrls {

	private static final String SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

	private SpriteUrls() {
	}

	/** Small front sprite (PNG) of a Pokémon; for default forms the id is also the species id. */
	public static String sprite(int pokemonId) {
		return SPRITES + pokemonId + ".png";
	}

}

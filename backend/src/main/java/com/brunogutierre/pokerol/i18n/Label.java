package com.brunogutierre.pokerol.i18n;

/**
 * A PokeAPI identifier with its localized display name, e.g. {@code {"key":"grass","name":"Plante"}}.
 * The key is stable (use it for filters, CSS classes, icons); the name is for display.
 */
public record Label(String key, String name) {
}

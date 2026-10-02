package com.brunogutierre.pokerol.i18n;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Languages supported by the API ({@code ?lang=}). Each one knows its PokeAPI language
 * identifier and the {@link Locale} used to sort localized names.
 */
public enum Lang {

	EN("en", "en"),

	/** PokeAPI calls it {@code pt-br} and has almost no data for it: English is the usual fallback. */
	PT_BR("pt-BR", "pt-br"),

	FR("fr", "fr"),

	ES("es", "es");

	private final String code;

	private final String pokeApiCode;

	private final Locale locale;

	Lang(String code, String pokeApiCode) {
		this.code = code;
		this.pokeApiCode = pokeApiCode;
		this.locale = Locale.forLanguageTag(code);
	}

	/** Public code used by the API, e.g. {@code pt-BR}. */
	public String code() {
		return code;
	}

	/** Language identifier used by PokeAPI, e.g. {@code pt-br}. */
	public String pokeApiCode() {
		return pokeApiCode;
	}

	public Locale locale() {
		return locale;
	}

	/**
	 * Parses an API code, ignoring case ({@code pt-br}, {@code PT-BR} and {@code pt-BR} are equal).
	 * @throws IllegalArgumentException if the language is not supported
	 */
	public static Lang fromCode(String code) {
		return Arrays.stream(values())
			.filter(lang -> lang.code.equalsIgnoreCase(code.strip()))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("Unsupported language: " + code));
	}

	/** Maps a PokeAPI language identifier back to a supported language, if it is one. */
	public static Optional<Lang> fromPokeApiCode(String pokeApiCode) {
		return Arrays.stream(values()).filter(lang -> lang.pokeApiCode.equals(pokeApiCode)).findFirst();
	}

	/** PokeAPI identifiers of all supported languages, e.g. to filter GraphQL queries. */
	public static List<String> pokeApiCodes() {
		return Arrays.stream(values()).map(Lang::pokeApiCode).toList();
	}

}

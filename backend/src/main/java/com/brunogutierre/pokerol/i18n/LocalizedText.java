package com.brunogutierre.pokerol.i18n;

import java.util.Map;
import java.util.Optional;

import org.jspecify.annotations.Nullable;

/**
 * Picks the text to show from per-language variants. Fallback order: requested language,
 * then English, then the PokeAPI identifier. Blank texts count as missing.
 */
public final class LocalizedText {

	private LocalizedText() {
	}

	/**
	 * A chosen text.
	 * @param text the text to show
	 * @param fallback {@code true} if English was used because the requested language had no text
	 */
	public record Pick(String text, boolean fallback) {
	}

	/** Requested language → English → {@code identifier}. */
	public static String pick(Map<Lang, String> texts, Lang lang, String identifier) {
		return pick(texts, lang).map(Pick::text).orElse(identifier);
	}

	/** Requested language → English, telling whether English was a fallback; empty if neither exists. */
	public static Optional<Pick> pick(Map<Lang, String> texts, Lang lang) {
		var requested = texts.get(lang);
		if (hasText(requested)) {
			return Optional.of(new Pick(requested, false));
		}
		var english = texts.get(Lang.EN);
		return hasText(english) ? Optional.of(new Pick(english, lang != Lang.EN)) : Optional.empty();
	}

	private static boolean hasText(@Nullable String text) {
		return text != null && !text.isBlank();
	}

}

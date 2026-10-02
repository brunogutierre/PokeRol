package com.brunogutierre.pokerol.i18n;

import java.util.Map;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LocalizedTextTest {

	static final Map<Lang, String> NAMES = Map.of(Lang.EN, "Overgrow", Lang.FR, "Engrais", Lang.ES, " ");

	@Test
	void prefersRequestedLanguage() {
		assertThat(LocalizedText.pick(NAMES, Lang.FR, "overgrow")).isEqualTo("Engrais");
		assertThat(LocalizedText.pick(NAMES, Lang.FR)).contains(new LocalizedText.Pick("Engrais", false));
	}

	@Test
	void fallsBackToEnglishForMissingOrBlankText() {
		assertThat(LocalizedText.pick(NAMES, Lang.PT_BR, "overgrow")).isEqualTo("Overgrow");
		assertThat(LocalizedText.pick(NAMES, Lang.ES)).contains(new LocalizedText.Pick("Overgrow", true));
	}

	@Test
	void englishIsNeverAFallbackForEnglish() {
		assertThat(LocalizedText.pick(NAMES, Lang.EN)).contains(new LocalizedText.Pick("Overgrow", false));
	}

	@Test
	void fallsBackToIdentifierWhenNothingIsTranslated() {
		assertThat(LocalizedText.pick(Map.of(), Lang.FR, "overgrow")).isEqualTo("overgrow");
		assertThat(LocalizedText.pick(Map.of(Lang.FR, "Engrais"), Lang.ES)).isEmpty();
	}

}

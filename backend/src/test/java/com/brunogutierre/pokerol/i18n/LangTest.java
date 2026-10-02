package com.brunogutierre.pokerol.i18n;

import java.util.Locale;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class LangTest {

	@ParameterizedTest
	@CsvSource({ "en, EN", "EN, EN", "pt-BR, PT_BR", "pt-br, PT_BR", "' fr ', FR", "Es, ES" })
	void parsesCodesIgnoringCase(String code, Lang expected) {
		assertThat(new LangConverter().convert(code)).isEqualTo(expected);
	}

	@ParameterizedTest
	@ValueSource(strings = { "", "de", "pt", "pt_BR", "english" })
	void rejectsUnsupportedCodes(String code) {
		assertThatIllegalArgumentException().isThrownBy(() -> Lang.fromCode(code))
			.withMessageContaining("Unsupported language");
	}

	@Test
	void mapsToPokeApiLanguages() {
		assertThat(Lang.pokeApiCodes()).containsExactly("en", "pt-br", "fr", "es");
		assertThat(Lang.fromPokeApiCode("pt-br")).contains(Lang.PT_BR);
		assertThat(Lang.fromPokeApiCode("ja")).isEmpty();
	}

	@Test
	void exposesLocaleForSorting() {
		assertThat(Lang.PT_BR.locale()).isEqualTo(Locale.of("pt", "BR"));
		assertThat(Lang.PT_BR.code()).isEqualTo("pt-BR");
	}

}

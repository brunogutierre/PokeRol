package com.brunogutierre.pokerol.i18n;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Binds the {@code lang} request parameter to {@link Lang}. Spring Boot registers
 * {@link Converter} beans in the MVC conversion service; an unsupported value ends up as a
 * type mismatch, rendered as 400 Problem Details.
 */
@Component
public class LangConverter implements Converter<String, Lang> {

	@Override
	public Lang convert(String source) {
		return Lang.fromCode(source);
	}

}

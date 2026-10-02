package com.brunogutierre.pokerol.web;

import java.util.Arrays;

import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;

/**
 * Binds request parameters to enums ignoring case ({@code ?sort=name} → {@code NAME}).
 * Enums with their own converter (e.g. {@code Lang}) keep using it: Spring prefers the most
 * specific converter.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
class CaseInsensitiveEnumConverterFactory implements ConverterFactory<String, Enum> {

	@Override
	public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
		return source -> (T) Arrays.stream(targetType.getEnumConstants())
			.filter(constant -> ((Enum<?>) constant).name().equalsIgnoreCase(source.strip()))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("No " + targetType.getSimpleName() + " " + source));
	}

}

package com.brunogutierre.pokerol.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The API is read-only, so browsers from the allowed origins may only send GET requests.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(CorsProperties.class)
class CorsConfig implements WebMvcConfigurer {

	private final CorsProperties properties;

	CorsConfig(CorsProperties properties) {
		this.properties = properties;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
			.allowedOrigins(properties.allowedOrigins().toArray(String[]::new))
			.allowedMethods("GET")
			.maxAge(3600);
	}

}

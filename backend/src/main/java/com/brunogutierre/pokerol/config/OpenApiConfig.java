package com.brunogutierre.pokerol.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadata shown in the generated OpenAPI document and Swagger UI.
 */
@Configuration(proxyBeanMethods = false)
class OpenApiConfig {

	@Bean
	OpenAPI pokeRolOpenApi() {
		return new OpenAPI().info(new Info().title("PokeRol API")
			.description("Multilingual Pokédex data adapted from PokeAPI for the PokeRol frontend.")
			.version("v1")
			.license(new License().name("MIT").url("https://opensource.org/licenses/MIT")));
	}

}

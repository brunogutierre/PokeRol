package com.brunogutierre.pokerol.pokemon;

import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.web.ApiCaching;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.Positive;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pokemon")
class PokemonController {

	private final PokemonDetailService service;

	PokemonController(PokemonDetailService service) {
		this.service = service;
	}

	@Operation(summary = "Localized details of a Pokémon (species id or variety id such as 10033)")
	@GetMapping("/{id}")
	ResponseEntity<PokemonDetail> detail(@PathVariable @Positive int id,
			@RequestParam(defaultValue = "en") Lang lang) {
		var detail = service.getDetail(id, lang);
		return ResponseEntity.ok().cacheControl(ApiCaching.cacheControl(service.indexDegraded())).body(detail);
	}

}

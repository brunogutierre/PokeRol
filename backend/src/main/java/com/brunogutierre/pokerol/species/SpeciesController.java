package com.brunogutierre.pokerol.species;

import java.util.List;

import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
import com.brunogutierre.pokerol.web.ApiCaching;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.jspecify.annotations.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
class SpeciesController {

	private final SpeciesQueryService service;

	SpeciesController(SpeciesQueryService service) {
		this.service = service;
	}

	@Operation(summary = "Search, filter, sort and page the species list")
	@GetMapping("/pokemon")
	ResponseEntity<PokemonPage> list(@RequestParam(defaultValue = "en") Lang lang,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "18") @Min(1) @Max(100) int size,
			@RequestParam(required = false) @Nullable String q, @RequestParam(required = false) @Nullable String type,
			@RequestParam(defaultValue = "number") SpeciesSort sort,
			@RequestParam(defaultValue = "asc") SortDirection dir) {
		var result = service.search(new SpeciesQuery(lang, q, type, sort, dir, page, size));
		return ResponseEntity.ok().cacheControl(ApiCaching.cacheControl(result.degraded())).body(result);
	}

	@Operation(summary = "Pokémon types with localized names")
	@GetMapping("/types")
	ResponseEntity<List<Label>> types(@RequestParam(defaultValue = "en") Lang lang) {
		var types = service.types(lang);
		return ResponseEntity.ok().cacheControl(ApiCaching.cacheControl(service.degraded())).body(types);
	}

}

package com.brunogutierre.pokerol.species;

import java.util.List;
import java.util.Set;

import com.brunogutierre.pokerol.i18n.Label;
import com.brunogutierre.pokerol.i18n.Lang;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class SpeciesQueryServiceTest {

	final SpeciesIndexProvider provider = mock();

	final TypeMembership typeMembership = mock();

	final SpeciesQueryService service = new SpeciesQueryService(provider, typeMembership);

	static SpeciesQuery query(Lang lang, String q, String type, SpeciesSort sort, SortDirection dir, int page,
			int size) {
		return new SpeciesQuery(lang, q, type, sort, dir, page, size);
	}

	static SpeciesQuery all(Lang lang, String q, String type) {
		return query(lang, q, type, SpeciesSort.NUMBER, SortDirection.ASC, 0, 100);
	}

	@Test
	void pagesInNationalOrderWithLocalizedSummaries() {
		given(provider.get()).willReturn(SpeciesFixtures.index());

		var page = service.search(query(Lang.FR, null, null, SpeciesSort.NUMBER, SortDirection.ASC, 0, 2));

		assertThat(page.items()).extracting(PokemonSummary::id).containsExactly(1, 4);
		assertThat(page.totalItems()).isEqualTo(6);
		assertThat(page.totalPages()).isEqualTo(3);
		assertThat(page.degraded()).isFalse();
		assertThat(page.items().getFirst()).isEqualTo(new PokemonSummary(1, "Bulbizarre",
				List.of(new Label("grass", "Plante"), new Label("poison", "Poison")), "green",
				"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
				List.of("Engrais")));
	}

	@Test
	void returnsEmptyItemsAfterTheLastPage() {
		given(provider.get()).willReturn(SpeciesFixtures.index());

		var page = service.search(query(Lang.EN, null, null, SpeciesSort.NUMBER, SortDirection.ASC, 5, 18));

		assertThat(page.items()).isEmpty();
		assertThat(page.totalItems()).isEqualTo(6);
		assertThat(page.totalPages()).isEqualTo(1);
	}

	@ParameterizedTest
	@CsvSource({ "fr, evoli, 133", "fr, EEVEE, 133", "fr, Salamèche, 4", "es, #25, 25", "en, 172, 172",
			"en, rai, 26", "fr, pik, 25" })
	void matchesLocalizedNameEnglishNameOrNumber(String lang, String q, int expectedId) {
		given(provider.get()).willReturn(SpeciesFixtures.index());

		assertThat(service.search(all(Lang.fromCode(lang), q, null)).items()).extracting(PokemonSummary::id)
			.containsExactly(expectedId);
	}

	@Test
	void filtersByTypeIgnoringCase() {
		given(provider.get()).willReturn(SpeciesFixtures.index());

		assertThat(service.search(all(Lang.EN, "", "Electric")).items()).extracting(PokemonSummary::id)
			.containsExactly(25, 26, 172);
	}

	@Test
	void rejectsUnknownType() {
		given(provider.get()).willReturn(SpeciesFixtures.index());

		assertThatExceptionOfType(ResponseStatusException.class)
			.isThrownBy(() -> service.search(all(Lang.EN, null, "stellar")))
			.withMessageContaining("Unknown type: stellar");
	}

	@Test
	void sortsByLocalizedNameWithLanguageCollation() {
		given(provider.get()).willReturn(SpeciesFixtures.index());

		var asc = service.search(query(Lang.FR, null, null, SpeciesSort.NAME, SortDirection.ASC, 0, 10));
		var desc = service.search(query(Lang.FR, null, null, SpeciesSort.NAME, SortDirection.DESC, 0, 10));

		assertThat(asc.items()).extracting(PokemonSummary::name)
			.containsExactly("Bulbizarre", "Évoli", "Pichu", "Pikachu", "Raichu", "Salamèche");
		assertThat(desc.items()).extracting(PokemonSummary::id).containsExactly(4, 26, 25, 172, 133, 1);
	}

	@Test
	void filtersDegradedIndexByTypeThroughPokeApi() {
		given(provider.get()).willReturn(SpeciesFixtures.degradedIndex());
		given(typeMembership.speciesIds("fire")).willReturn(Set.of(4, 6));

		var page = service.search(all(Lang.FR, null, "fire"));

		assertThat(page.degraded()).isTrue();
		assertThat(page.items()).singleElement().satisfies(summary -> {
			assertThat(summary.name()).isEqualTo("charmander");
			assertThat(summary.types()).isEmpty();
			assertThat(summary.color()).isNull();
		});
	}

	@Test
	void listsLocalizedTypes() {
		given(provider.get()).willReturn(SpeciesFixtures.index());

		assertThat(service.types(Lang.ES)).hasSize(18).startsWith(new Label("normal", "Normal"),
				new Label("fighting", "Lucha"));
		assertThat(service.degraded()).isFalse();
	}

}

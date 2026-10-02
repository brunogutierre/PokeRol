package com.brunogutierre.pokerol.species;

import com.brunogutierre.pokerol.config.PokeApiClientConfig;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.BASE_URL;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.PROPERTIES;
import static com.brunogutierre.pokerol.pokeapi.PokeApiTestSupport.fixture;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class TypeMembershipTest {

	@Test
	void keepsOnlyDefaultFormsAsSpeciesIds() {
		var builder = RestClient.builder();
		var server = MockRestServiceServer.bindTo(builder).build();
		server.expect(requestTo(BASE_URL + "/type/electric"))
			.andRespond(withSuccess(fixture("pokeapi/type-electric.json"), MediaType.APPLICATION_JSON));
		var membership = new TypeMembership(PokeApiClientConfig.restClient(builder, PROPERTIES));

		assertThat(membership.speciesIds("electric")).containsExactlyInAnyOrder(25, 26, 81);
	}

}

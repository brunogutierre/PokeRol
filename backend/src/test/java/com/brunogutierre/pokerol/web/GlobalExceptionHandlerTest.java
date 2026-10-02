package com.brunogutierre.pokerol.web;

import com.brunogutierre.pokerol.pokeapi.PokeApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import static org.assertj.core.api.Assertions.assertThat;

@WebMvcTest(controllers = GlobalExceptionHandlerTest.FailingController.class)
@Import(GlobalExceptionHandlerTest.FailingController.class)
class GlobalExceptionHandlerTest {

	@Autowired
	MockMvcTester mvc;

	@Test
	void hidesInternalsOfUnexpectedErrors() {
		assertThat(mvc.get().uri("/test/boom")).hasStatus(HttpStatus.INTERNAL_SERVER_ERROR)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyJson()
			.isEqualTo("""
					{"title":"Internal Server Error","status":500,
					 "detail":"Unexpected server error","instance":"/test/boom"}""");
	}

	@Test
	void rendersUnknownRoutesAsProblem() {
		assertThat(mvc.get().uri("/test/missing")).hasStatus(HttpStatus.NOT_FOUND)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON);
	}

	@Test
	void mapsUpstreamNotFoundTo404() {
		assertThat(mvc.get().uri("/test/upstream-404")).hasStatus(HttpStatus.NOT_FOUND)
			.bodyJson()
			.extractingPath("$.detail")
			.isEqualTo("The requested resource does not exist");
	}

	@ParameterizedTest
	@ValueSource(strings = { "/test/upstream-503", "/test/upstream-timeout", "/test/upstream-429",
			"/test/graphql-error" })
	void mapsUpstreamFailuresTo502(String uri) {
		assertThat(mvc.get().uri(uri)).hasStatus(HttpStatus.BAD_GATEWAY)
			.hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
			.bodyJson()
			.isEqualTo("""
					{"type":"/problems/upstream-unavailable","title":"Upstream unavailable","status":502,
					 "detail":"PokeAPI is unavailable right now, please try again later","instance":"%s"}""".formatted(uri));
	}

	@RestController
	static class FailingController {

		@GetMapping("/test/upstream-404")
		String upstreamNotFound() {
			throw HttpClientErrorException.create(HttpStatus.NOT_FOUND, "Not Found", null, null, null);
		}

		@GetMapping("/test/upstream-429")
		String upstreamRateLimited() {
			throw HttpClientErrorException.create(HttpStatus.TOO_MANY_REQUESTS, "Too Many", null, null, null);
		}

		@GetMapping("/test/upstream-503")
		String upstreamDown() {
			throw HttpServerErrorException.create(HttpStatus.SERVICE_UNAVAILABLE, "Unavailable", null, null, null);
		}

		@GetMapping("/test/upstream-timeout")
		String upstreamTimeout() {
			throw new ResourceAccessException("Read timed out");
		}

		@GetMapping("/test/graphql-error")
		String graphQlError() {
			throw new PokeApiException("GraphQL query failed");
		}

		@GetMapping("/test/boom")
		String boom() {
			throw new IllegalStateException("secret internal detail");
		}

	}

}

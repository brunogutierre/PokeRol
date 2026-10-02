package com.brunogutierre.pokerol.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

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

	@RestController
	static class FailingController {

		@GetMapping("/test/boom")
		String boom() {
			throw new IllegalStateException("secret internal detail");
		}

	}

}

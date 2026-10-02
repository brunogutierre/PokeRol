package com.brunogutierre.pokerol;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
class PokeRolApplicationTests {

	@Autowired
	MockMvcTester mvc;

	@Test
	void exposesHealthEndpoint() {
		assertThat(mvc.get().uri("/actuator/health")).hasStatusOk()
			.bodyJson()
			.extractingPath("$.status")
			.isEqualTo("UP");
	}

	@Test
	void allowsHealthPingFromFrontendOrigin() {
		assertThat(mvc.get().uri("/actuator/health").header(HttpHeaders.ORIGIN, "http://localhost:4200"))
			.hasStatusOk()
			.hasHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4200");
	}

	@Test
	void rejectsUnknownOrigin() {
		assertThat(mvc.get().uri("/actuator/health").header(HttpHeaders.ORIGIN, "https://evil.example"))
			.hasStatus(HttpStatus.FORBIDDEN);
	}

	@Test
	void exposesOpenApiDocument() {
		assertThat(mvc.get().uri("/v3/api-docs")).hasStatusOk()
			.bodyJson()
			.extractingPath("$.info.title")
			.isEqualTo("PokeRol API");
	}

	@Test
	void servesSwaggerUi() {
		assertThat(mvc.get().uri("/swagger-ui/index.html")).hasStatusOk();
	}

}

package com.brunogutierre.pokerol.web;

import java.net.URI;
import java.util.stream.Collectors;

import com.brunogutierre.pokerol.pokeapi.PokeApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Renders every error as an RFC 9457 Problem Details document. Spring MVC errors
 * (type mismatch, validation, unknown route...) are handled by the base class.
 */
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	static final URI UPSTREAM_UNAVAILABLE = URI.create("/problems/upstream-unavailable");

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	/** Invalid query parameter value, e.g. {@code ?lang=xx} or {@code ?page=abc}. */
	@Override
	protected @Nullable ResponseEntity<Object> handleTypeMismatch(TypeMismatchException ex, HttpHeaders headers,
			HttpStatusCode status, WebRequest request) {
		var problem = ProblemDetail.forStatusAndDetail(status,
				"Invalid value '%s' for parameter '%s'".formatted(ex.getValue(), ex.getPropertyName()));
		return handleExceptionInternal(ex, problem, headers, status, request);
	}

	/** Constraint violations on query or path parameters, e.g. {@code ?size=500}. */
	@Override
	protected @Nullable ResponseEntity<Object> handleHandlerMethodValidationException(
			HandlerMethodValidationException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		var detail = ex.getParameterValidationResults()
			.stream()
			.flatMap(result -> result.getResolvableErrors()
				.stream()
				.map(error -> result.getMethodParameter().getParameterName() + ": " + error.getDefaultMessage()))
			.collect(Collectors.joining("; "));
		var problem = ProblemDetail.forStatusAndDetail(status, detail);
		return handleExceptionInternal(ex, problem, headers, status, request);
	}

	/** PokeAPI does not know the requested resource, so neither do we. */
	@ExceptionHandler(HttpClientErrorException.NotFound.class)
	ProblemDetail handleUpstreamNotFound(HttpClientErrorException.NotFound ex) {
		return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "The requested resource does not exist");
	}

	/** PokeAPI is down, slow, rate limiting us or answering garbage: a gateway problem (502). */
	@ExceptionHandler({ RestClientException.class, PokeApiException.class })
	ProblemDetail handleUpstreamFailure(RuntimeException ex) {
		log.warn("PokeAPI call failed: {}", ex.toString());
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY,
				"PokeAPI is unavailable right now, please try again later");
		problem.setType(UPSTREAM_UNAVAILABLE);
		problem.setTitle("Upstream unavailable");
		return problem;
	}

	/** Last resort: log the failure, but never leak stack traces or internals to clients. */
	@ExceptionHandler(Exception.class)
	ProblemDetail handleUnexpected(Exception ex) {
		log.error("Unexpected error", ex);
		return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
	}

}

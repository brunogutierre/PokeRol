package com.brunogutierre.pokerol.pokeapi;

import java.io.IOException;
import java.io.InterruptedIOException;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

/**
 * Retries a PokeAPI call after an I/O error (timeout, connection reset...) or a 5xx
 * response, with exponential backoff. 4xx responses are final and returned at once.
 * After the last attempt the error (or the 5xx response) is propagated unchanged.
 */
public class RetryInterceptor implements ClientHttpRequestInterceptor {

	private static final Logger log = LoggerFactory.getLogger(RetryInterceptor.class);

	private final int maxRetries;

	private final Duration backoff;

	public RetryInterceptor(int maxRetries, Duration backoff) {
		this.maxRetries = maxRetries;
		this.backoff = backoff;
	}

	@Override
	public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
			throws IOException {
		for (int attempt = 0;; attempt++) {
			try {
				var response = execution.execute(request, body);
				if (attempt == maxRetries || !response.getStatusCode().is5xxServerError()) {
					return response;
				}
				log.warn("PokeAPI {} {} answered {}, retrying", request.getMethod(), request.getURI(),
						response.getStatusCode().value());
				response.close();
			}
			catch (IOException ex) {
				if (attempt == maxRetries) {
					throw ex;
				}
				log.warn("PokeAPI {} {} failed ({}), retrying", request.getMethod(), request.getURI(), ex.toString());
			}
			pause(backoff.multipliedBy(1L << attempt));
		}
	}

	private static void pause(Duration duration) throws InterruptedIOException {
		try {
			Thread.sleep(duration);
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new InterruptedIOException("Interrupted while waiting to retry");
		}
	}

}

package com.brunogutierre.pokerol.config;

import java.net.http.HttpClient;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.brunogutierre.pokerol.pokeapi.PokeApiGraphQlClient;
import com.brunogutierre.pokerol.pokeapi.PokeApiRestClient;
import com.brunogutierre.pokerol.pokeapi.RetryInterceptor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

/**
 * Builds the two PokeAPI clients on top of Boot's {@link RestClient.Builder} (which brings
 * Jackson and observability): JDK {@code HttpClient} with timeouts, descriptive User-Agent
 * and retry on I/O errors and 5xx responses.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(PokeApiProperties.class)
public class PokeApiClientConfig {

	/**
	 * One cheap virtual thread per task, for background index loads and parallel PokeAPI calls.
	 * Defining it makes Boot skip its own {@code applicationTaskExecutor}, which this app does not use.
	 */
	@Bean(destroyMethod = "close")
	ExecutorService pokeApiExecutor() {
		return Executors.newVirtualThreadPerTaskExecutor();
	}

	@Bean
	PokeApiRestClient pokeApiRestClient(RestClient.Builder builder, PokeApiProperties properties) {
		return restClient(builder.requestFactory(requestFactory(properties)), properties);
	}

	@Bean
	PokeApiGraphQlClient pokeApiGraphQlClient(RestClient.Builder builder, PokeApiProperties properties) {
		return graphQlClient(builder.requestFactory(requestFactory(properties)), properties);
	}

	/** Creates the REST client; the builder's request factory is kept (tests bind a mock server). */
	public static PokeApiRestClient restClient(RestClient.Builder builder, PokeApiProperties properties) {
		var restClient = common(builder, properties).baseUrl(properties.baseUrl()).build();
		return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient))
			.build()
			.createClient(PokeApiRestClient.class);
	}

	/** Creates the GraphQL client; the builder's request factory is kept (tests bind a mock server). */
	public static PokeApiGraphQlClient graphQlClient(RestClient.Builder builder, PokeApiProperties properties) {
		return new PokeApiGraphQlClient(common(builder, properties).baseUrl(properties.graphqlUrl()).build());
	}

	static ClientHttpRequestFactory requestFactory(PokeApiProperties properties) {
		var httpClient = HttpClient.newBuilder()
			.connectTimeout(properties.connectTimeout())
			.followRedirects(HttpClient.Redirect.NORMAL)
			.build();
		var factory = new JdkClientHttpRequestFactory(httpClient);
		factory.setReadTimeout(properties.readTimeout());
		return factory;
	}

	private static RestClient.Builder common(RestClient.Builder builder, PokeApiProperties properties) {
		return builder.defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
			.requestInterceptor(new RetryInterceptor(properties.maxRetries(), properties.retryBackoff()));
	}

}

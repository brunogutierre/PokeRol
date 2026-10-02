package com.brunogutierre.pokerol.species;

import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executor;

import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Holds the current {@link SpeciesIndex}.
 * <ul>
 * <li><b>Single flight</b>: concurrent callers share one load; PokeAPI is never asked twice at once.</li>
 * <li><b>Stale while revalidate</b>: an expired index is still served while a new one loads in the
 * background (24 h, or 5 min for a degraded index).</li>
 * <li><b>Warm up</b>: the first load starts when the application is ready, not on the first request.</li>
 * </ul>
 */
@Component
@EnableConfigurationProperties(SpeciesIndexProperties.class)
public class SpeciesIndexProvider {

	private static final Logger log = LoggerFactory.getLogger(SpeciesIndexProvider.class);

	private final SpeciesIndexLoader loader;

	private final SpeciesIndexProperties properties;

	private final Executor executor;

	private final Clock clock;

	private volatile @Nullable Snapshot current;

	/** The load in progress, if any (guarded by {@code this}). */
	private @Nullable CompletableFuture<SpeciesIndex> inFlight;

	@Autowired
	public SpeciesIndexProvider(SpeciesIndexLoader loader, SpeciesIndexProperties properties,
			@Qualifier("pokeApiExecutor") Executor executor) {
		this(loader, properties, executor, Clock.systemUTC());
	}

	SpeciesIndexProvider(SpeciesIndexLoader loader, SpeciesIndexProperties properties, Executor executor,
			Clock clock) {
		this.loader = loader;
		this.properties = properties;
		this.executor = executor;
		this.clock = clock;
	}

	/**
	 * Returns the index, waiting for the first load if needed.
	 * @throws RuntimeException the loader's error if there is no index yet and loading fails
	 */
	public SpeciesIndex get() {
		var snapshot = current;
		if (snapshot == null) {
			return await(reload());
		}
		if (snapshot.isExpired(clock.instant())) {
			reload();
		}
		return snapshot.index();
	}

	@EventListener(ApplicationReadyEvent.class)
	public void warmUp() {
		if (properties.warmUp()) {
			reload();
		}
	}

	/** Starts a load unless one is already running, and returns it. */
	synchronized CompletableFuture<SpeciesIndex> reload() {
		var future = inFlight;
		if (future == null) {
			future = CompletableFuture.supplyAsync(loader::load, executor).whenComplete(this::loaded);
			// A synchronous executor (tests) may already have completed and cleared the load.
			inFlight = future.isDone() ? null : future;
		}
		return future;
	}

	private synchronized void loaded(@Nullable SpeciesIndex index, @Nullable Throwable error) {
		inFlight = null;
		if (index != null) {
			var ttl = index.degraded() ? properties.degradedTtl() : properties.ttl();
			current = new Snapshot(index, clock.instant().plus(ttl));
		}
		else {
			log.warn("Species index load failed: {}", String.valueOf(error));
		}
	}

	private static SpeciesIndex await(CompletableFuture<SpeciesIndex> future) {
		try {
			return future.join();
		}
		catch (CompletionException ex) {
			if (ex.getCause() instanceof RuntimeException cause) {
				throw cause;
			}
			throw ex;
		}
	}

	private record Snapshot(SpeciesIndex index, Instant expiresAt) {

		boolean isExpired(Instant now) {
			return !now.isBefore(expiresAt);
		}

	}

}

package com.brunogutierre.pokerol.species;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.ResourceAccessException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

class SpeciesIndexProviderTest {

	static final SpeciesIndexProperties PROPERTIES = new SpeciesIndexProperties(Duration.ofHours(24),
			Duration.ofMinutes(5), true);

	static final Executor INLINE = Runnable::run;

	final SpeciesIndexLoader loader = mock();

	final MutableClock clock = new MutableClock();

	final SpeciesIndex first = index(false);

	final SpeciesIndex second = index(false);

	@Test
	void loadsOnceAndCaches() {
		given(loader.load()).willReturn(first);
		var provider = new SpeciesIndexProvider(loader, PROPERTIES, INLINE, clock);

		assertThat(provider.get()).isSameAs(first);
		assertThat(provider.get()).isSameAs(first);
		then(loader).should(times(1)).load();
	}

	@Test
	void servesStaleIndexWhileReloadingAfterTtl() {
		given(loader.load()).willReturn(first, second);
		var provider = new SpeciesIndexProvider(loader, PROPERTIES, INLINE, clock);
		provider.get();

		clock.advance(Duration.ofHours(24));

		assertThat(provider.get()).as("stale index served once").isSameAs(first);
		assertThat(provider.get()).isSameAs(second);
	}

	@Test
	void degradedIndexExpiresSooner() {
		given(loader.load()).willReturn(index(true), first);
		var provider = new SpeciesIndexProvider(loader, PROPERTIES, INLINE, clock);
		provider.get();

		clock.advance(Duration.ofMinutes(5));
		provider.get();

		assertThat(provider.get()).isSameAs(first);
	}

	@Test
	void propagatesFailureWithoutIndexAndRetriesNextTime() {
		given(loader.load()).willThrow(new ResourceAccessException("down")).willReturn(first);
		var provider = new SpeciesIndexProvider(loader, PROPERTIES, INLINE, clock);

		assertThatExceptionOfType(ResourceAccessException.class).isThrownBy(provider::get);
		assertThat(provider.get()).isSameAs(first);
	}

	@Test
	void keepsServingOldIndexWhenReloadFails() {
		given(loader.load()).willReturn(first).willThrow(new ResourceAccessException("down"));
		var provider = new SpeciesIndexProvider(loader, PROPERTIES, INLINE, clock);
		provider.get();
		clock.advance(Duration.ofDays(2));

		assertThat(provider.get()).isSameAs(first);
		assertThat(provider.get()).isSameAs(first);
	}

	@Test
	void concurrentCallersShareOneLoad() throws Exception {
		var release = new CountDownLatch(1);
		given(loader.load()).willAnswer(invocation -> {
			release.await(5, TimeUnit.SECONDS);
			return first;
		});
		try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
			var provider = new SpeciesIndexProvider(loader, PROPERTIES, executor, clock);
			var callers = List.of(CompletableFuture.supplyAsync(provider::get, executor),
					CompletableFuture.supplyAsync(provider::get, executor),
					CompletableFuture.supplyAsync(provider::get, executor));
			Thread.sleep(100);
			release.countDown();

			assertThat(callers).allSatisfy(caller -> assertThat(caller.get(5, TimeUnit.SECONDS)).isSameAs(first));
		}
		then(loader).should(times(1)).load();
	}

	@Test
	void warmsUpOnlyWhenEnabled() {
		given(loader.load()).willReturn(first);
		new SpeciesIndexProvider(loader, new SpeciesIndexProperties(Duration.ofHours(1), Duration.ofHours(1), false),
				INLINE, clock)
			.warmUp();
		then(loader).should(never()).load();

		var provider = new SpeciesIndexProvider(loader, PROPERTIES, INLINE, clock);
		provider.warmUp();
		then(loader).should(times(1)).load();
		assertThat(provider.get()).isSameAs(first);
	}

	static SpeciesIndex index(boolean degraded) {
		return new SpeciesIndex(List.of(), Lookups.typesOnly(LabelTable.EMPTY), degraded);
	}

	static final class MutableClock extends Clock {

		private Instant now = Instant.parse("2026-01-01T00:00:00Z");

		void advance(Duration duration) {
			now = now.plus(duration);
		}

		@Override
		public Instant instant() {
			return now;
		}

		@Override
		public ZoneOffset getZone() {
			return ZoneOffset.UTC;
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return this;
		}

	}

}

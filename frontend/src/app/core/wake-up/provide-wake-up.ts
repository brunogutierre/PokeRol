import { HttpClient } from '@angular/common/http';
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { API_URL } from '../api/api-url';

/**
 * Pings the API health endpoint at startup without blocking the bootstrap, so a sleeping
 * free-tier server starts booting while the app renders. Register `wakeUpInterceptor` too.
 */
export function provideWakeUpPing(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      inject(HttpClient)
        .get(`${inject(API_URL)}/actuator/health`)
        .subscribe({ error: () => undefined });
    }),
  ]);
}

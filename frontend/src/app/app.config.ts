import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { provideI18n } from './core/i18n/provide-i18n';
import { provideFocusOnNavigation } from './core/navigation/focus-on-navigation';
import { onViewTransitionCreated } from './core/navigation/view-transitions';
import { provideWakeUpPing } from './core/wake-up/provide-wake-up';
import { wakeUpInterceptor } from './core/wake-up/wake-up.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([wakeUpInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true, onViewTransitionCreated }),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideI18n(),
    provideFocusOnNavigation(),
    provideWakeUpPing(),
  ],
};

import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Base URL of the BFF (no trailing slash). */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideAngularQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';
import { createQueryClient } from './core/query/query-client.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideAngularQuery(createQueryClient()),
  ]
};

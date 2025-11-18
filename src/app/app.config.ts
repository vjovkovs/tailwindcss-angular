import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig  } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import {
  provideAngularQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { IPublicClientApplication, PublicClientApplication, InteractionType, BrowserCacheLocation, LogLevel } from '@azure/msal-browser';
import { MsalInterceptor, MSAL_INSTANCE, MsalInterceptorConfiguration, MsalGuardConfiguration, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MsalService, MsalGuard, MsalBroadcastService } from '@azure/msal-angular';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';
import { createQueryClient } from './core/query/query-client.config';
import { environment } from '../environments/environment';

/**
 * Factory function to create MSAL instance
 */
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msal.clientId,
      authority: environment.msal.authority,
      redirectUri: environment.msal.redirectUri,
      postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage, // Store tokens in localStorage
      storeAuthStateInCookie: false, // Set to true for IE11 or Edge
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Info:
              console.info(message);
              return;
            case LogLevel.Verbose:
              console.debug(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
          }
        },
        piiLoggingEnabled: false,
      },
      allowNativeBroker: false, // Disables WAM Broker
    },
  });
}

/**
 * Factory function to create MSAL Guard configuration
 */
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect, // Use redirect for login
    authRequest: {
      scopes: environment.msal.scopes,
    },
  };
}

/**
 * Factory function to create MSAL Interceptor configuration
 */
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = environment.msal.protectedResourceMap;

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withRouterConfig({ 
      onSameUrlNavigation: 'reload'
    })),
    provideAnimations(), // Add this line
    provideHttpClient(
      withInterceptors([apiInterceptor]),
      withInterceptorsFromDi() // Enable class-based interceptors (MsalInterceptor)
    ),
    provideAngularQuery(createQueryClient()),

    // MSAL Configuration
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ]
};

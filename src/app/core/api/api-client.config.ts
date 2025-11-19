import { inject } from '@angular/core';
import { client } from './generated/client.gen';
import { AuthService } from '../auth/auth.service';
import { environment } from 'environments/environment';

/**
 * Configure the generated API client with MSAL authentication
 *
 * This adds an interceptor that automatically fetches and adds
 * the bearer token to all API requests. It integrates seamlessly
 * with the SSO Silent authentication flow.
 */
export function configureApiClient() {
  const authService = inject(AuthService);

  // Add request interceptor to include bearer token
  client.interceptors.request.use(async (request, options) => {
    try {
      // Wait for authentication to initialize (SSO Silent may still be in progress)
      // This prevents race conditions where API calls happen before auth is ready
      const maxWaitTime = 5000; // 5 seconds max wait
      const startTime = Date.now();

      while (!authService.isInitialized() && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // If user is authenticated, add bearer token
      if (authService.isAuthenticated()) {
        const token = await authService.getAccessToken();

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        } else {
          console.warn('Could not acquire access token for API request');
        }
      } else {
        // User is not authenticated - request will proceed without token
        // The backend will return 401 if authentication is required
        console.debug('API request made without authentication - user not logged in');
      }
    } catch (error) {
      console.error('Error adding bearer token to request:', error);
      // Continue with request even if token acquisition fails
      // Backend will handle unauthorized requests appropriately
    }

    return request;
  });
}


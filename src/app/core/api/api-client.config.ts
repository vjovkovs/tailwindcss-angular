import { inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { client } from './generated/client.gen';
import { environment } from '../../environments/environment';

/**
 * Configure the generated API client with MSAL authentication
 *
 * This adds an interceptor that automatically fetches and adds
 * the bearer token to all API requests.
 */
export function configureApiClient() {
  const msalService = inject(MsalService);

  // Add request interceptor to include bearer token
  client.interceptors.request.use(async (request, options) => {
    try {
      // Get the active account
      const account = msalService.instance.getActiveAccount();

      if (account) {
        // Acquire token silently
        const response = await msalService.instance.acquireTokenSilent({
          scopes: ['api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user'],
          account: account,
        });

        // Add Authorization header
        request.headers.set('Authorization', `Bearer ${response.accessToken}`);
      }
    } catch (error) {
      console.error('Failed to acquire token:', error);

      // If silent token acquisition fails, try interactive
      try {
        const response = await msalService.instance.acquireTokenPopup({
          scopes: ['api://9c097f4f-fe4c-4035-abe9-2b41caaf983c/access_as_user'],
        });
        request.headers.set('Authorization', `Bearer ${response.accessToken}`);
      } catch (interactiveError) {
        console.error('Interactive token acquisition failed:', interactiveError);
      }
    }

    return request;
  });
}

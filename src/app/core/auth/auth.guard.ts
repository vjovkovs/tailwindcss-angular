import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Auth guard for protected routes using MSAL with SSO
 *
 * Checks if user is authenticated via Azure AD.
 * If not authenticated after SSO check, redirects to unauthorized page or triggers login.
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for authentication initialization to complete
  // This ensures SSO silent has been attempted
  const maxWaitTime = 5000; // 5 seconds max wait
  const startTime = Date.now();

  while (!authService.isInitialized() && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    sessionStorage.setItem('returnUrl', state.url);

    // Trigger login redirect since SSO didn't work
    // This will redirect to Azure AD login page
    authService.loginRedirect();
    return false;
  }

  return true;
};

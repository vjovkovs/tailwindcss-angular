import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Auth guard for protected routes using MSAL
 *
 * Checks if user is authenticated via Azure AD.
 * If not authenticated, redirects to login page.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    sessionStorage.setItem('returnUrl', state.url);

    // Redirect to login page
    // The login page will handle MSAL authentication
    router.navigate(['/login']);
    return false;
  }

  return true;
};

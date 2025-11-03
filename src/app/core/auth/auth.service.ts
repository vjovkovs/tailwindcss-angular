import { Injectable, signal } from '@angular/core';

/**
 * Auth service placeholder
 * MSAL-ready: Replace with @azure/msal-angular when needed
 *
 * Example MSAL integration:
 * - Install @azure/msal-browser @azure/msal-angular
 * - Configure MSAL in app.config.ts
 * - Replace this service with MsalService
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use signal for reactive authentication state
  private readonly authenticated = signal<boolean>(false);

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated();
  }

  /**
   * Get current authentication state as signal
   */
  getAuthState() {
    return this.authenticated.asReadonly();
  }

  /**
   * Login (placeholder)
   */
  login(): void {
    // TODO: Implement MSAL login
    this.authenticated.set(true);
  }

  /**
   * Logout (placeholder)
   */
  logout(): void {
    // TODO: Implement MSAL logout
    this.authenticated.set(false);
  }

  /**
   * Get access token (placeholder)
   */
  getAccessToken(): string | null {
    // TODO: Implement MSAL token acquisition
    return null;
  }
}

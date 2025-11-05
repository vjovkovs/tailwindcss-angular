import { Injectable, inject, signal } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  InteractionStatus,
  PopupRequest,
  RedirectRequest,
  EndSessionRequest,
  SsoSilentRequest,
  AccountInfo,
} from '@azure/msal-browser';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Auth Service using Microsoft Authentication Library (MSAL)
 *
 * Provides authentication functionality using Azure AD:
 * - SSO Silent authentication (automatically sign in if user has active Microsoft session)
 * - Login (popup or redirect)
 * - Logout
 * - Get access tokens
 * - Check authentication status
 * - Get user information
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly destroy$ = new Subject<void>();

  // Reactive authentication state
  readonly isAuthenticated = signal<boolean>(false);
  readonly userInfo = signal<any>(null);
  readonly isInitialized = signal<boolean>(false);

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state by checking MSAL accounts
   */
  private async initializeAuthState(): Promise<void> {
    try {
      // Ensure MSAL is initialized
      await this.msalService.instance.initialize();
      
      // Check if there are any accounts
      const accounts = this.msalService.instance.getAllAccounts();
      this.isAuthenticated.set(accounts.length > 0);

      if (accounts.length > 0) {
        this.msalService.instance.setActiveAccount(accounts[0]);
        this.updateUserInfo();
      }

      // Listen for login success/failure events
      this.msalBroadcastService.inProgress$
        .pipe(
          filter((status: InteractionStatus) => status === InteractionStatus.None),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          const accounts = this.msalService.instance.getAllAccounts();
          this.isAuthenticated.set(accounts.length > 0);

          if (accounts.length > 0) {
            this.msalService.instance.setActiveAccount(accounts[0]);
            this.updateUserInfo();
          } else {
            this.userInfo.set(null);
          }
        });
    } catch (error) {
      console.error('MSAL initialization failed:', error);
    }
  }

  /**
   * Update user information from the active account
   */
  private updateUserInfo(): void {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.userInfo.set({
        name: account.name || account.username,
        username: account.username,
        email: account.username,
        ...account.idTokenClaims,
      });
    }
  }

  /**
   * Login using popup
   */
  async loginPopup(): Promise<void> {
    try {
      // Ensure MSAL is initialized before login
      await this.msalService.instance.initialize();
      
      const loginRequest: PopupRequest = {
        scopes: environment.msal.scopes,
      };

      this.msalService
        .loginPopup(loginRequest)
        .subscribe({
          next: (result: AuthenticationResult) => {
            this.msalService.instance.setActiveAccount(result.account);
            this.isAuthenticated.set(true);
            this.updateUserInfo();
          },
          error: (error) => {
            console.error('Login failed:', error);
          },
        });
    } catch (error) {
      console.error('MSAL initialization failed during login:', error);
    }
  }

  /**
   * Login using redirect
   */
  loginRedirect(): void {
    const loginRequest: RedirectRequest = {
      scopes: environment.msal.scopes,
    };

    this.msalService.loginRedirect(loginRequest);
  }

  /**
   * Logout using popup
   */
  logoutPopup(): void {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      const logoutRequest: EndSessionRequest = {
        account,
        postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
      };

      this.msalService.logoutPopup(logoutRequest).subscribe({
        next: () => {
          this.isAuthenticated.set(false);
          this.userInfo.set(null);
        },
        error: (error) => {
          console.error('Logout failed:', error);
        },
      });
    }
  }

  /**
   * Logout using redirect
   */
  logoutRedirect(): void {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      const logoutRequest: EndSessionRequest = {
        account,
        postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
      };

      this.msalService.logoutRedirect(logoutRequest);
    }
  }

  /**
   * Get access token for the specified scopes
   * Tries silent acquisition first, falls back to interactive if needed
   */
  async getAccessToken(scopes: string[] = environment.msal.scopes): Promise<string | null> {
    const account = this.msalService.instance.getActiveAccount();
    if (!account) {
      return null;
    }

    try {
      // Try silent token acquisition first
      const result = await this.msalService.instance.acquireTokenSilent({
        scopes,
        account,
      });

      return result.accessToken;
    } catch (error) {
      console.warn('Silent token acquisition failed, falling back to interactive:', error);

      // Fall back to interactive acquisition
      try {
        const result = await this.msalService.instance.acquireTokenPopup({
          scopes,
          account,
        });
        return result.accessToken;
      } catch (interactiveError) {
        console.error('Interactive token acquisition failed:', interactiveError);
        return null;
      }
    }
  }

  /**
   * Get the active account
   */
  getActiveAccount() {
    return this.msalService.instance.getActiveAccount();
  }

  /**
   * Attempt SSO Silent authentication
   * This checks if the user has an active session with Microsoft services
   * and automatically signs them in without interaction
   *
   * @returns Promise<boolean> - true if SSO was successful, false otherwise
   */
  async attemptSsoSilent(): Promise<boolean> {
    try {
      // Ensure MSAL is initialized
      await this.msalService.instance.initialize();

      // Check if we already have an account
      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length > 0) {
        this.msalService.instance.setActiveAccount(accounts[0]);
        this.isAuthenticated.set(true);
        this.updateUserInfo();
        this.isInitialized.set(true);
        return true;
      }

      // Attempt SSO silent login
      const ssoRequest: SsoSilentRequest = {
        scopes: environment.msal.scopes,
        loginHint: '', // Can be populated if you know the user's email
      };

      try {
        const result: AuthenticationResult = await this.msalService.instance.ssoSilent(ssoRequest);

        if (result && result.account) {
          this.msalService.instance.setActiveAccount(result.account);
          this.isAuthenticated.set(true);
          this.updateUserInfo();
          this.isInitialized.set(true);
          console.log('SSO Silent authentication successful');
          return true;
        }
      } catch (ssoError: any) {
        // SSO Silent failed - this is expected if user has no active session
        console.log('SSO Silent authentication not available:', ssoError.errorCode || ssoError.message);
        this.isInitialized.set(true);
        return false;
      }

      this.isInitialized.set(true);
      return false;
    } catch (error) {
      console.error('SSO Silent authentication error:', error);
      this.isInitialized.set(true);
      return false;
    }
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

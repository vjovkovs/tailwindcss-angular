import { Injectable, inject, signal } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  InteractionStatus,
  PopupRequest,
  RedirectRequest,
  EndSessionRequest,
} from '@azure/msal-browser';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Auth Service using Microsoft Authentication Library (MSAL)
 *
 * Provides authentication functionality using Azure AD:
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

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state by checking MSAL accounts
   */
  private initializeAuthState(): void {
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
  loginPopup(): void {
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
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

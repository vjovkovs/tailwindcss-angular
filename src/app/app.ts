import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth/auth.service';
import { environment } from '../environments/environment';
import { NavigationComponent } from './shared/components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NavigationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal(environment.appName);
  protected readonly authService = inject(AuthService);
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly destroy$ = new Subject<void>();

  async ngOnInit(): Promise<void> {
    try {
      // Ensure MSAL is initialized first
      await this.msalService.instance.initialize();

      // Handle redirect promise (for redirect-based login flows)
      const redirectResponse = await this.msalService.instance.handleRedirectPromise();
      if (redirectResponse) {
        this.msalService.instance.setActiveAccount(redirectResponse.account);
        this.authService.isAuthenticated.set(true);

        // Redirect to the originally requested URL if available
        const returnUrl = sessionStorage.getItem('returnUrl');
        if (returnUrl) {
          sessionStorage.removeItem('returnUrl');
          window.location.href = returnUrl;
        }
      } else {
        // No redirect response, attempt SSO Silent authentication
        console.log('Attempting SSO Silent authentication...');
        await this.authService.attemptSsoSilent();
      }

      // Subscribe to login/logout events
      this.msalBroadcastService.inProgress$
        .pipe(
          filter((status: InteractionStatus) => status === InteractionStatus.None),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.checkAndSetActiveAccount();
        });
    } catch (error) {
      console.error('Failed to initialize MSAL in app component:', error);
      // Mark as initialized even on error to prevent infinite loading
      this.authService.isInitialized.set(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAndSetActiveAccount(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
  }

  /**
   * Login using popup
   */
  async login(): Promise<void> {
    await this.authService.loginPopup();
  }

  /**
   * Logout using popup
   */
  logout(): void {
    this.authService.logoutPopup();
  }
}

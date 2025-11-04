import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Angular + Tailwind Template');
  protected readonly authService = inject(AuthService);
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Handle redirect promise
    this.msalService.instance.handleRedirectPromise().then((response) => {
      if (response) {
        this.msalService.instance.setActiveAccount(response.account);
      }
    });

    // Subscribe to login/logout events
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
      });
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
  login(): void {
    this.authService.loginPopup();
  }

  /**
   * Logout using popup
   */
  logout(): void {
    this.authService.logoutPopup();
  }
}

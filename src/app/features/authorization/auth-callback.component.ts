import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventType } from '@azure/msal-browser';

@Component({
  selector: 'app-auth-callback',
  template:`<div class="flex flex-col items-center justify-center min-h-screen">
              @if(isLoading){
              <div class="loader mb-4"></div>
              <p class="text-lg text-gray-700">Processing authentication...</p>
              }
            </div>`,
})
export class AuthCallbackComponent implements OnInit, OnDestroy {
  isLoading = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService) { }

  ngOnInit() {
    this.isLoading = true;
    this.subscriptions.push(
      this.msalBroadcastService.msalSubject$.subscribe((result) => {
        if (result.eventType === EventType.LOGIN_SUCCESS) {
          this.isLoading = false;
          this.router.navigate(['/']);
        } else if (result.eventType === EventType.LOGIN_FAILURE) {
          this.isLoading = false;
          this.router.navigate(['/unauthorized']);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}

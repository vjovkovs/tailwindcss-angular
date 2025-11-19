import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="drawer lg:drawer-open">
      <!-- Drawer toggle (hidden checkbox) -->
      <input id="app-drawer" type="checkbox" class="drawer-toggle" />

      <!-- Main content area -->
      <div class="drawer-content flex flex-col">
        <!-- Mobile navbar with hamburger -->
        <div class="navbar bg-base-100 shadow-sm lg:hidden">
          <div class="flex-none">
            <label for="app-drawer" class="btn btn-square btn-ghost drawer-button">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
          <div class="flex-1">
            <a class="btn btn-ghost text-xl normal-case">{{ appTitle() }}</a>
          </div>
        </div>

        <!-- Page content -->
        <div class="flex-1">
          <ng-content></ng-content>
        </div>
      </div>

      <!-- Sidebar drawer -->
      <div class="drawer-side z-40">
        <label for="app-drawer" class="drawer-overlay"></label>

        <!-- Sidebar content -->
        <aside class="min-h-screen w-64 bg-base-200">
          <!-- Logo/Brand -->
          <div class="sticky top-0 z-10 bg-base-200 px-4 py-6">
            <h1 class="text-2xl font-bold text-primary">{{ appTitle() }}</h1>
            <p class="text-xs text-base-content/60 mt-1">{{ appSubtitle() }}</p>
          </div>

          <!-- Navigation menu -->
          <ul class="menu px-4 py-0">
            @for (item of navItems(); track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{exact: item.route === '/'}"
                  [class.active]="isActive(item.route)"
                  class="flex items-center gap-3 rounded-lg"
                  (click)="onNavItemClick()"
                >
                  <span [innerHTML]="item.icon" class="w-5 h-5"></span>
                  <span class="flex-1">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="badge badge-sm badge-primary">{{ item.badge }}</span>
                  }
                </a>
              </li>
            }
          </ul>

          <!-- Divider -->
          <!-- <div class="divider px-4"></div> -->

          <!-- Settings/User section -->
          <!-- <ul class="menu px-4 py-0">
            <li>
              <a class="flex items-center gap-3 rounded-lg">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </a>
            </li>
            <li>
              <a class="flex items-center gap-3 rounded-lg">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </a>
            </li>
          </ul> -->
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .drawer {
      height: 100vh;
    }

    .drawer-content {
      height: 100vh;
      overflow-y: auto;
    }
  `]
})
export class NavigationComponent {
  private router = inject(Router);

  appTitle = signal(environment.companyName);
  appSubtitle = signal('Document Management');

  navItems = signal<NavItem[]>([
    {
      label: 'Dashboard',
      icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>',
      route: '/',
    },
    {
      label: 'Audits',
      icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
      route: '/audits',
    },
        {
      label: 'Reference Audits',
      icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
      route: '/reference-audits',
    },
    {
      label: 'Suppliers',
      icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>',
      route: '/suppliers',
    },
    {
      label: 'Personnel',
      icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
      route: '/personnel',
    },
    {
      label: 'Examples',
      icon: '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>',
      route: '/example',
    },
  ]);

  /**
   * Check if a route is currently active
   */
  isActive(route: string): boolean {
    if (route === '/') {
      return this.router.url === '/';
    }
    return this.router.url.startsWith(route);
  }

  /**
   * Close drawer on mobile when nav item is clicked
   */
  onNavItemClick(): void {
    // On mobile, close the drawer after navigation
    if (window.innerWidth < 1024) {
      const drawerToggle = document.getElementById('app-drawer') as HTMLInputElement;
      if (drawerToggle) {
        drawerToggle.checked = false;
      }
    }
  }
}

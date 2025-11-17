import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type {
  AuditResponse,
  SupplierDetailsResponse,
  PaginatedResponseOfAuditResponse,
} from '@/core/api/generated';

/**
 * Example API Component
 *
 * Demonstrates how to use the NUPIC Document Manager API services:
 * - Fetch and display audits with pagination
 * - Search suppliers
 * - Upload and download files
 * - Error handling
 */
@Component({
  selector: 'app-example-api',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">NUPIC API Examples</h1>
              <p class="mt-2 text-sm text-gray-600">
                Demonstrating type-safe API integration with Zod validation
              </p>
            </div>
            <nav class="flex gap-4">
              <a routerLink="/" class="text-blue-600 hover:text-blue-800">Home</a>
              <a routerLink="/phase2" class="text-blue-600 hover:text-blue-800">Phase 2</a>
              <a routerLink="/phase3" class="text-blue-600 hover:text-blue-800">Phase 3</a>
            </nav>
          </div>
        </div>

        <!-- API Examples -->
        <div class="space-y-8">
          <!-- Audits Section -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Audits Management</h2>

            <div class="flex gap-4 mb-4">
              <button
                (click)="loadAudits()"
                [disabled]="loadingAudits()"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {{ loadingAudits() ? 'Loading...' : 'Load Audits' }}
              </button>

              <input
                type="text"
                [(ngModel)]="searchTerm"
                placeholder="Search audits..."
                class="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                (click)="searchAudits()"
                [disabled]="loadingAudits()"
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Search
              </button>
            </div>

            @if (auditsError()) {
              <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <p class="text-red-800 font-medium">Error:</p>
                <p class="text-red-600">{{ auditsError() }}</p>
              </div>
            }

            @if (audits()) {
              <div class="space-y-2">
                <div class="text-sm text-gray-600 mb-2">
                  Showing {{ audits()!.items.length }} of {{ audits()!.totalCount }} audits
                  (Page {{ audits()!.pageNumber }} of {{ audits()!.totalPages }})
                </div>

                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Audit #
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Supplier
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Lead Auditor
                        </th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      @for (audit of audits()!.items; track audit.id) {
                        <tr class="hover:bg-gray-50">
                          <td class="px-4 py-2 text-sm font-medium text-gray-900">
                            {{ audit.auditNumber }}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-600">
                            {{ audit.supplierNumber }}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-600">
                            {{ audit.auditTypeName }}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-600">
                            {{ audit.leadAuditorName }}
                          </td>
                          <td class="px-4 py-2 text-sm">
                            <span
                              [class]="audit.auditApproved ? 'text-green-600 font-medium' : 'text-yellow-600'"
                            >
                              {{ audit.auditApproved ? 'Approved' : 'Pending' }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (audits()!.totalPages > 1) {
                  <div class="flex justify-between items-center mt-4">
                    <button
                      (click)="previousPage()"
                      [disabled]="!audits()!.hasPreviousPage || loadingAudits()"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>

                    <span class="text-sm text-gray-600">
                      Page {{ audits()!.pageNumber }} of {{ audits()!.totalPages }}
                    </span>

                    <button
                      (click)="nextPage()"
                      [disabled]="!audits()!.hasNextPage || loadingAudits()"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Suppliers Section -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Suppliers</h2>

            <button
              (click)="loadSuppliers()"
              [disabled]="loadingSuppliers()"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mb-4"
            >
              {{ loadingSuppliers() ? 'Loading...' : 'Load Suppliers' }}
            </button>

            @if (suppliersError()) {
              <div class="p-4 bg-red-50 border border-red-200 rounded">
                <p class="text-red-800 font-medium">Error:</p>
                <p class="text-red-600">{{ suppliersError() }}</p>
              </div>
            }

            @if (suppliers()) {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (supplier of suppliers(); track supplier.supplierNumber) {
                  <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 class="font-semibold text-lg text-gray-900">{{ supplier.supplierName }}</h3>
                    <p class="text-sm text-gray-600">{{ supplier.supplierNumber }}</p>
                    <p class="text-sm text-gray-500 mt-2">{{ supplier.location }}</p>
                    <p class="text-sm text-gray-500">Audits: {{ supplier.auditCount }}</p>
                    <span
                      [class]="supplier.isActive ? 'text-green-600' : 'text-red-600'"
                      class="text-xs font-medium mt-2 inline-block"
                    >
                      {{ supplier.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- API Usage Tips -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-blue-900 mb-4">API Usage Tips</h2>
            <ul class="space-y-2 text-sm text-blue-800">
              <li>✅ All API calls are type-safe with TypeScript interfaces</li>
              <li>✅ Zod validation ensures runtime type safety</li>
              <li>✅ MSAL token is automatically attached to requests</li>
              <li>✅ Error handling with ProblemDetails support</li>
              <li>✅ Pagination, search, and filtering built-in</li>
            </ul>

            <div class="mt-4 p-4 bg-white rounded border border-blue-300">
              <p class="font-mono text-xs text-gray-700">
                <span class="text-blue-600">import</span> {{ '{' }} AuditsService {{ '}' }}
                <span class="text-blue-600">from</span> '@core/api/services';<br />
                <br />
                <span class="text-gray-500">// Inject service</span><br />
                <span class="text-blue-600">private</span> auditsService =
                <span class="text-purple-600">inject</span>(AuditsService);<br />
                <br />
                <span class="text-gray-500">// Make type-safe API call</span><br />
                <span class="text-blue-600">this</span>.auditsService.getAllAudits({{ '{' }}
                pageNumber<span class="text-gray-500">:</span> <span class="text-orange-600">1</span>
                {{ '}' }})<br />
                &nbsp;&nbsp;.<span class="text-purple-600">subscribe</span>(audits =>
                console.<span class="text-purple-600">log</span>(audits));
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ExampleApiComponent implements OnInit {
  private readonly router = inject(Router);

  // Audits state
  audits = signal<PaginatedResponseOfAuditResponse | null>(null);
  loadingAudits = signal(false);
  auditsError = signal<string | null>(null);
  currentPage = signal(1);
  pageSize = 20;
  searchTerm = '';

  // Suppliers state
  suppliers = signal<SupplierDetailsResponse[] | null>(null);
  loadingSuppliers = signal(false);
  suppliersError = signal<string | null>(null);

  ngOnInit() {
    // Optionally load data on init
    // this.loadAudits();
  }

  loadAudits() {
    // TODO: Refactor to use TanStack Query's getAllAuditsQuery()
    // For now, this is disabled since we migrated to TanStack Query exclusively
    console.log('Load audits - refactor needed to use TanStack Query');
    this.auditsError.set('This example needs to be refactored to use TanStack Query. See suppliers-table.component.ts for a working example.');
  }

  searchAudits() {
    this.currentPage.set(1);
    this.loadAudits();
  }

  nextPage() {
    if (this.audits()?.hasNextPage) {
      this.currentPage.update((p) => p + 1);
      this.loadAudits();
    }
  }

  previousPage() {
    if (this.audits()?.hasPreviousPage) {
      this.currentPage.update((p) => p - 1);
      this.loadAudits();
    }
  }

  loadSuppliers() {
    // TODO: Refactor to use TanStack Query's getSuppliersQuery()
    // For now, this is disabled since we migrated to TanStack Query exclusively
    console.log('Load suppliers - refactor needed to use TanStack Query');
    this.suppliersError.set('This example needs to be refactored to use TanStack Query. See suppliers-table.component.ts for a working example.');
  }
}

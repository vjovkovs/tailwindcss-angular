import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, FieldGroup, FormStep } from '../../shared/components/dynamic-form';
import { z } from 'zod';

/**
 * Example Component for Phase 3 Dynamic Forms Features
 * Demonstrates:
 * - Multi-step wizard forms with progress indicator
 * - Grid layout system with column spanning
 * - Field grouping with collapsible sections
 */

// Phase 3: Multi-step registration form schema
const registrationSchema = z.object({
  // Step 1: Personal Information
  firstName: z.string().min(1).describe('First Name'),
  lastName: z.string().min(1).describe('Last Name'),
  email: z.string().email().describe('Email Address'),
  phone: z.string().describe('Phone Number|phone'),
  birthDate: z.string().describe('Date of Birth|date'),

  // Step 2: Address
  street: z.string().min(1).describe('Street Address'),
  city: z.string().min(1).describe('City'),
  state: z.string().min(2).max(2).describe('State'),
  zipCode: z.string().min(5).describe('ZIP Code'),
  country: z.string().default('US').describe('Country'),

  // Step 3: Account Settings
  username: z.string().min(3).max(20).describe('Username'),
  password: z.string().min(8).describe('Password|password'),
  confirmPassword: z.string().min(8).describe('Confirm Password|password'),
  newsletter: z.boolean().describe('Subscribe to newsletter'),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms').describe('I accept the terms and conditions'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

@Component({
  selector: 'app-example-phase3',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, DynamicFormComponent],
  template: `
    <!-- <div class="max-w-6xl mx-auto p-6">
      <div class="flex gap-2 mb-6 pb-4 border-b border-gray-200"> -->
    <div class="space-y-6">
      <!-- Navigation -->
      <div class="flex gap-2 pb-4 border-b border-gray-200">
        <a routerLink="/" routerLinkActive="bg-primary-100 text-primary-700" [routerLinkActiveOptions]="{ exact: true }" class="text-sm px-3 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200">
          Phase 1: Basic Forms
        </a>
        <a routerLink="/phase2" routerLinkActive="bg-primary-100 text-primary-700" class="text-sm px-3 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200">
          Phase 2: Advanced Forms
        </a>
        <a routerLink="/phase3" routerLinkActive="bg-primary-100 text-primary-700" class="text-sm px-3 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200">
          Phase 3: Layouts & Steps
        </a>
      </div>

      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Phase 3: Layouts, Groups & Multi-Step Forms
        </h1>
        <p class="text-gray-600">
          Choose a demo below to explore grid layouts, field grouping, and multi-step wizard forms.
        </p>
      </div>

      <!-- Demo Selector -->
      <div class="flex gap-4 mb-8">
        <button
          (click)="currentDemo.set('multistep')"
          [class.bg-primary-600]="currentDemo() === 'multistep'"
          [class.text-white]="currentDemo() === 'multistep'"
          [class.bg-white]="currentDemo() !== 'multistep'"
          [class.text-gray-700]="currentDemo() !== 'multistep'"
          class="px-4 py-2 rounded-lg border border-gray-300 font-medium hover:shadow-md transition-shadow"
        >
          🧙 Multi-Step Wizard
        </button>
        <button
          (click)="currentDemo.set('grid')"
          [class.bg-primary-600]="currentDemo() === 'grid'"
          [class.text-white]="currentDemo() === 'grid'"
          [class.bg-white]="currentDemo() !== 'grid'"
          [class.text-gray-700]="currentDemo() !== 'grid'"
          class="px-4 py-2 rounded-lg border border-gray-300 font-medium hover:shadow-md transition-shadow"
        >
          📐 Grid Layout
        </button>
        <button
          (click)="currentDemo.set('groups')"
          [class.bg-primary-600]="currentDemo() === 'groups'"
          [class.text-white]="currentDemo() === 'groups'"
          [class.bg-white]="currentDemo() !== 'groups'"
          [class.text-gray-700]="currentDemo() !== 'groups'"
          class="px-4 py-2 rounded-lg border border-gray-300 font-medium hover:shadow-md transition-shadow"
        >
          📋 Field Groups
        </button>
      </div>

      <!-- Multi-Step Demo -->
      @if (currentDemo() === 'multistep') {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Multi-Step Registration Wizard</h2>
          <p class="text-sm text-gray-600 mb-6">
            Complete the registration form across 3 steps. The form validates each step before allowing you to proceed.
          </p>

          <app-dynamic-form
            [config]="multiStepConfig"
            [loading]="isSubmitting()"
            (formSubmit)="onSubmit($event, 'Multi-Step')"
            (formCancel)="onCancel()"
          />
        </div>
      }

      <!-- Grid Layout Demo -->
      @if (currentDemo() === 'grid') {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Grid Layout Form</h2>
          <p class="text-sm text-gray-600 mb-6">
            Fields are arranged in a responsive grid. Some fields span multiple columns for better visual hierarchy.
          </p>

          <app-dynamic-form
            [config]="gridConfig"
            [loading]="isSubmitting()"
            (formSubmit)="onSubmit($event, 'Grid')"
            (formCancel)="onCancel()"
          />
        </div>
      }

      <!-- Field Groups Demo -->
      @if (currentDemo() === 'groups') {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Grouped Fields with Collapsible Sections</h2>
          <p class="text-sm text-gray-600 mb-6">
            Fields are organized into collapsible groups. Click group headers to expand/collapse sections.
          </p>

          <app-dynamic-form
            [config]="groupsConfig"
            [loading]="isSubmitting()"
            (formSubmit)="onSubmit($event, 'Groups')"
            (formCancel)="onCancel()"
          />
        </div>
      }

      <!-- Results Display -->
      @if (submittedData()) {
        <div class="mt-6 bg-green-50 rounded-lg border border-green-200 p-6">
          <h3 class="text-lg font-semibold text-green-900 mb-3">
            ✓ Form Submitted Successfully! ({{ submittedDemo() }})
          </h3>
          <div class="bg-white rounded p-4 overflow-x-auto">
            <pre class="text-sm text-gray-800">{{ submittedData() | json }}</pre>
          </div>
        </div>
      }

      <!-- Feature Highlights -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 class="font-semibold text-purple-900 mb-2">🧙 Multi-Step Wizard</h4>
          <p class="text-sm text-purple-800">
            Break long forms into manageable steps with progress indicator, step validation, and smooth navigation.
          </p>
        </div>

        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 class="font-semibold text-blue-900 mb-2">📐 Grid Layouts</h4>
          <p class="text-sm text-blue-800">
            Responsive grid system with 2, 3, or 4 columns. Fields can span multiple columns for flexible layouts.
          </p>
        </div>

        <div class="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 class="font-semibold text-green-900 mb-2">📋 Field Groups</h4>
          <p class="text-sm text-green-800">
            Organize related fields into collapsible groups with titles, descriptions, and icons for better UX.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ExamplePhase3Component {
  protected readonly currentDemo = signal<'multistep' | 'grid' | 'groups'>('multistep');
  protected readonly isSubmitting = signal(false);
  protected readonly submittedData = signal<RegistrationFormData | null>(null);
  protected readonly submittedDemo = signal<string>('');

  // Phase 3: Multi-step configuration
  protected readonly multiStepConfig: DynamicFormConfig<typeof registrationSchema.shape> = {
    schema: registrationSchema,
    submitLabel: 'Complete Registration',
    showCancel: true,
    steps: [
      {
        id: 'personal',
        title: 'Personal Info',
        description: 'Tell us about yourself',
        fields: ['firstName', 'lastName', 'email', 'phone', 'birthDate'],
        icon: '👤',
      },
      {
        id: 'address',
        title: 'Address',
        description: 'Where do you live?',
        fields: ['street', 'city', 'state', 'zipCode', 'country'],
        icon: '🏠',
      },
      {
        id: 'account',
        title: 'Account',
        description: 'Create your account',
        fields: ['username', 'password', 'confirmPassword', 'newsletter', 'terms'],
        icon: '🔐',
      },
    ],
  };

  // Phase 3: Grid layout configuration
  protected readonly gridConfig: DynamicFormConfig<typeof registrationSchema.shape> = {
    schema: registrationSchema,
    layout: 'grid',
    columns: 3,
    fields: {
      // Full width fields
      email: { colSpan: 3 },
      street: { colSpan: 3 },
      username: { colSpan: 3 },
      password: { colSpan: 2 },
      confirmPassword: { colSpan: 2 },
      // Other fields use default 1 column span
    },
    submitLabel: 'Submit Registration',
    showCancel: true,
  };

  // Phase 3: Field groups configuration
  protected readonly groupsConfig: DynamicFormConfig<typeof registrationSchema.shape> = {
    schema: registrationSchema,
    fields: {
      firstName: { group: 'personal' },
      lastName: { group: 'personal' },
      email: { group: 'personal' },
      phone: { group: 'personal' },
      birthDate: { group: 'personal' },

      street: { group: 'address' },
      city: { group: 'address' },
      state: { group: 'address' },
      zipCode: { group: 'address' },
      country: { group: 'address' },

      username: { group: 'account' },
      password: { group: 'account' },
      confirmPassword: { group: 'account' },
      newsletter: { group: 'preferences' },
      terms: { group: 'preferences' },
    },
    groups: [
      {
        id: 'personal',
        title: '👤 Personal Information',
        description: 'Your basic contact details',
        collapsible: true,
        collapsed: false,
      },
      {
        id: 'address',
        title: '🏠 Address',
        description: 'Where can we reach you?',
        collapsible: true,
        collapsed: false,
      },
      {
        id: 'account',
        title: '🔐 Account Security',
        description: 'Set up your login credentials',
        collapsible: true,
        collapsed: false,
      },
      {
        id: 'preferences',
        title: '⚙️ Preferences',
        description: 'Communication and legal agreements',
        collapsible: true,
        collapsed: false,
      },
    ],
    layout: 'grid',
    columns: 2,
    submitLabel: 'Complete Registration',
    showCancel: true,
  };

  onSubmit(data: RegistrationFormData, demo: string): void {
    this.isSubmitting.set(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Registration data submitted:', data);
      this.submittedData.set(data);
      this.submittedDemo.set(demo);
      this.isSubmitting.set(false);
    }, 1500);
  }

  onCancel(): void {
    console.log('Form cancelled');
    this.submittedData.set(null);
  }
}

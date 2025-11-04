import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DynamicFormComponent, DynamicFormConfig, FieldCondition } from '../../shared/components/dynamic-form';
import { z } from 'zod';

/**
 * Example Component for Phase 2 Dynamic Forms Features
 * Demonstrates:
 * - Nested objects
 * - Array fields with add/remove
 * - Conditional field visibility
 * - Advanced field types (date, url, tel, password)
 * - Textarea for multiline input
 */

// Phase 2: Comprehensive schema with advanced features
const employeeFormSchema = z.object({
  // Basic info
  firstName: z.string().min(1).describe('First Name'),
  lastName: z.string().min(1).describe('Last Name'),
  email: z.string().email().describe('Email Address'),
  phone: z.string().describe('Phone Number|phone'),

  // Date fields
  birthDate: z.string().describe('Birth Date|date'),
  hireDate: z.string().describe('Hire Date|date'),

  // Employment type
  employmentType: z.enum(['Full-Time', 'Part-Time', 'Contract']).describe('Employment Type'),

  // Conditional: Show salary only for Full-Time and Part-Time
  salary: z.number().min(0).optional().describe('Annual Salary|Only for Full-Time/Part-Time'),

  // Conditional: Show hourly rate only for Contract
  hourlyRate: z.number().min(0).optional().describe('Hourly Rate|Only for Contract'),

  // Nested object: Address
  address: z.object({
    street: z.string().min(1).describe('Street Address'),
    city: z.string().min(1).describe('City'),
    state: z.string().min(2).max(2).describe('State|2-letter code'),
    zipCode: z.string().min(5).describe('ZIP Code'),
  }).describe('Home Address|Your residential address'),

  // Different shipping address checkbox
  hasShippingAddress: z.boolean().describe('Ship to different address?'),

  // Conditional nested object: Shipping address
  shippingAddress: z.object({
    street: z.string().min(1).describe('Street Address'),
    city: z.string().min(1).describe('City'),
    state: z.string().min(2).max(2).describe('State|2-letter code'),
    zipCode: z.string().min(5).describe('ZIP Code'),
  }).optional().describe('Shipping Address'),

  // Array of primitive values: Skills
  skills: z.array(z.string().min(1)).min(1).max(10).describe('Skills|Add your professional skills'),

  // Array of objects: Emergency contacts
  emergencyContacts: z.array(
    z.object({
      name: z.string().min(1).describe('Contact Name'),
      relationship: z.string().min(1).describe('Relationship'),
      phone: z.string().describe('Phone Number|phone'),
    })
  ).min(1).max(3).describe('Emergency Contacts|At least one required'),

  // Website/Portfolio
  portfolio: z.string().url().optional().describe('Portfolio/Website|url'),

  // Bio with textarea
  bio: z.string().max(500).optional().describe('Bio|textarea|Tell us about yourself (max 500 characters)'),

  // Password field (for demonstration)
  password: z.string().min(8).optional().describe('Password|password|Minimum 8 characters'),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

@Component({
  selector: 'app-example-phase2',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, DynamicFormComponent],
  template: `
    <!-- <div class="max-w-4xl mx-auto p-6">
      <div class="flex gap-2 mb-6 pb-4 border-b border-gray-200"> -->
    <div class="space-y-6">
      <!-- Navigation -->
      <div class="flex gap-2 pb-4 border-b border-gray-200">
        <a
          routerLink="/"
          routerLinkActive="bg-primary-100 text-primary-700"
          [routerLinkActiveOptions]="{ exact: true }"
          class="text-sm px-3 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200"
        >
          Phase 1: Basic Forms
        </a>
        <a
          routerLink="/phase2"
          routerLinkActive="bg-primary-100 text-primary-700"
          class="text-sm px-3 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200"
        >
          Phase 2: Advanced Forms
        </a>
        <a
          routerLink="/phase3"
          routerLinkActive="bg-primary-100 text-primary-700"
          class="text-sm px-3 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200"
        >
          Phase 3: Layouts & Steps
        </a>
      </div>

      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Phase 2: Advanced Dynamic Forms
        </h1>
        <p class="text-gray-600">
          This demo showcases all Phase 2 features including nested objects, arrays,
          conditional fields, and advanced field types.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Employee Registration</h2>

        <app-dynamic-form
          [config]="formConfig"
          [initialData]="initialData()"
          [loading]="isSubmitting()"
          (formSubmit)="onSubmit($event)"
          (formCancel)="onCancel()"
        />
      </div>

      <!-- Results Display -->
      @if (submittedData()) {
        <div class="mt-6 bg-green-50 rounded-lg border border-green-200 p-6">
          <h3 class="text-lg font-semibold text-green-900 mb-3">
            ✓ Form Submitted Successfully!
          </h3>
          <div class="bg-white rounded p-4 overflow-x-auto">
            <pre class="text-sm text-gray-800">{{ submittedData() | json }}</pre>
          </div>
        </div>
      }

      <!-- Feature Highlights -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 class="font-semibold text-blue-900 mb-2">🏗️ Nested Objects</h4>
          <p class="text-sm text-blue-800">
            The "Home Address" and "Shipping Address" fields demonstrate nested object rendering
            with proper grouping and styling.
          </p>
        </div>

        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 class="font-semibold text-purple-900 mb-2">📋 Array Fields</h4>
          <p class="text-sm text-purple-800">
            "Skills" (primitive array) and "Emergency Contacts" (object array) show dynamic
            add/remove functionality with min/max constraints.
          </p>
        </div>

        <div class="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 class="font-semibold text-amber-900 mb-2">🔀 Conditional Fields</h4>
          <p class="text-sm text-amber-800">
            Salary/hourly rate visibility changes based on employment type. Shipping address
            appears only when "Ship to different address" is checked.
          </p>
        </div>

        <div class="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 class="font-semibold text-green-900 mb-2">🎨 Advanced Types</h4>
          <p class="text-sm text-green-800">
            Date pickers, URL validation, phone input, password fields, and textarea
            are automatically inferred from schema.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ExamplePhase2Component {
  protected readonly isSubmitting = signal(false);
  protected readonly submittedData = signal<EmployeeFormData | null>(null);
  protected readonly initialData = signal<Partial<EmployeeFormData> | undefined>(undefined);

  // Phase 2: Dynamic form configuration with conditional fields
  protected readonly formConfig: DynamicFormConfig<typeof employeeFormSchema.shape> = {
    schema: employeeFormSchema,
    fields: {
      // Configure conditional visibility for salary
      salary: {
        condition: {
          field: 'employmentType',
          operator: 'contains',
          value: 'Full-Time',
        } as FieldCondition,
      },
      // Configure conditional visibility for hourly rate
      hourlyRate: {
        condition: {
          field: 'employmentType',
          operator: 'equals',
          value: 'Contract',
        } as FieldCondition,
      },
      // Configure conditional visibility for shipping address
      shippingAddress: {
        condition: {
          field: 'hasShippingAddress',
          operator: 'truthy',
        } as FieldCondition,
      },
      // Customize field placeholders
      employmentType: {
        placeholder: 'Select employment type',
      },
    },
    submitLabel: 'Register Employee',
    showCancel: true,
  };

  onSubmit(data: EmployeeFormData): void {
    this.isSubmitting.set(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Employee data submitted:', data);
      this.submittedData.set(data);
      this.isSubmitting.set(false);

      // Optionally reset form after success
      // this.initialData.set(undefined);
    }, 1500);
  }

  onCancel(): void {
    console.log('Form cancelled');
    this.submittedData.set(null);
  }

  /**
   * Load sample data for testing
   */
  loadSampleData(): void {
    this.initialData.set({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      birthDate: '1990-01-15',
      hireDate: '2024-01-01',
      employmentType: 'Full-Time',
      salary: 75000,
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
      },
      hasShippingAddress: false,
      skills: ['TypeScript', 'Angular', 'TailwindCSS'],
      emergencyContacts: [
        {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '(555) 987-6543',
        },
      ],
      portfolio: 'https://johndoe.dev',
      bio: 'Experienced full-stack developer with a passion for building scalable applications.',
    });
  }
}

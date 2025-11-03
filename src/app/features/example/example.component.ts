import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ApiService } from '../../core/http/api.service';
import { DialogComponent, DialogTitleDirective, DialogContentDirective, DialogActionsDirective } from '../../ui/dialog';
import { zodValidator } from '../../shared/utils/form.utils';
import { emailSchema, requiredStringSchema } from '../../shared/validators/schemas';
import { z } from 'zod';

/**
 * Example Feature Component
 * Demonstrates:
 * - TanStack Query for data fetching
 * - Typed Forms with Zod validation
 * - Dialog component usage
 * - Tailwind CSS styling
 */

// User schema
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
});

type User = z.infer<typeof userSchema>;

// Form schema
const userFormSchema = z.object({
  name: requiredStringSchema,
  email: emailSchema,
  role: requiredStringSchema,
});

type UserFormData = z.infer<typeof userFormSchema>;

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogComponent,
    DialogTitleDirective,
    DialogContentDirective,
    DialogActionsDirective,
  ],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css',
})
export class ExampleComponent {
  // Dialog state
  protected readonly dialogOpen = signal(false);

  // Mock data for demonstration (replace with real API call)
  protected readonly mockUsers: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  ];

  // Typed form with Zod validation
  protected readonly userForm = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, zodValidator(userFormSchema.shape.name)],
      nonNullable: true,
    }),
    email: new FormControl('', {
      validators: [Validators.required, zodValidator(userFormSchema.shape.email)],
      nonNullable: true,
    }),
    role: new FormControl('', {
      validators: [Validators.required, zodValidator(userFormSchema.shape.role)],
      nonNullable: true,
    }),
  });

  openDialog(): void {
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.userForm.reset();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.getRawValue();
      console.log('Form submitted:', formData);
      // Here you would normally use TanStack Mutation to create the user
      this.closeDialog();
    }
  }

  getFieldError(fieldName: string): string | null {
    const control = this.userForm.get(fieldName);
    if (control?.invalid && (control.dirty || control.touched)) {
      const errors = control.errors;
      if (errors) {
        return Object.values(errors)[0] as string;
      }
    }
    return null;
  }
}

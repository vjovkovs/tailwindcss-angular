import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { ApiService } from '../../core/http/api.service';
import { DialogComponent, DialogTitleDirective, DialogActionsDirective } from '../../ui/dialog';
import { zodValidator } from '../../shared/utils/form.utils';
import { emailSchema, requiredStringSchema } from '../../shared/validators/schemas';
import { z } from 'zod';
import { of, delay } from 'rxjs';

/**
 * Example Feature Component
 * Demonstrates:
 * - TanStack Query for data fetching with optimistic updates
 * - TanStack Mutations for create/update operations
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

// Mock data store (simulating a backend)
let mockUsersStore: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
];

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogComponent,
    DialogTitleDirective,
    DialogActionsDirective,
  ],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css',
})
export class ExampleComponent {
  private queryClient = injectQueryClient();

  // Dialog state
  protected readonly dialogOpen = signal(false);

  // Track editing state
  protected readonly editingUser = signal<User | null>(null);
  protected readonly isEditMode = signal(false);

  /**
   * TanStack Query for fetching users
   * This simulates a real API call with a delay
   */
  protected readonly usersQuery = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: () => {
      // Simulate API call with delay
      return of([...mockUsersStore]).pipe(delay(500)).toPromise();
    },
    initialData: [],
  }));

  /**
   * TanStack Mutation for creating users
   * Demonstrates optimistic updates for instant UI feedback
   */
  protected readonly createUserMutation = injectMutation(() => ({
    mutationFn: async (userData: UserFormData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newUser: User = {
        id: mockUsersStore.length + 1,
        ...userData,
      };

      mockUsersStore.push(newUser);
      return newUser;
    },

    // Optimistic update: immediately update UI before server responds
    onMutate: async (newUserData) => {
      // Cancel outgoing refetches
      await this.queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot previous value
      const previousUsers = this.queryClient.getQueryData<User[]>(['users']);

      // Optimistically update to the new value
      const tempId = Date.now(); // Temporary ID
      const optimisticUser: User = {
        id: tempId,
        ...newUserData,
      };

      this.queryClient.setQueryData<User[]>(['users'], (old = []) => [
        ...old,
        optimisticUser,
      ]);

      // Return context with snapshot
      return { previousUsers, tempId };
    },

    // On error, roll back to previous value
    onError: (_err, _newUser, context) => {
      if (context?.previousUsers) {
        this.queryClient.setQueryData(['users'], context.previousUsers);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },

    onSuccess: () => {
      this.closeDialog();
    },
  }));

  /**
   * TanStack Mutation for updating users
   * Demonstrates optimistic updates for editing
   */
  protected readonly updateUserMutation = injectMutation(() => ({
    mutationFn: async ({ id, data }: { id: number; data: UserFormData }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const index = mockUsersStore.findIndex(u => u.id === id);
      if (index !== -1) {
        mockUsersStore[index] = { id, ...data };
      }

      return mockUsersStore[index];
    },

    // Optimistic update
    onMutate: async ({ id, data }) => {
      await this.queryClient.cancelQueries({ queryKey: ['users'] });

      const previousUsers = this.queryClient.getQueryData<User[]>(['users']);

      // Optimistically update the user
      this.queryClient.setQueryData<User[]>(['users'], (old = []) =>
        old.map(user => (user.id === id ? { id, ...data } : user))
      );

      return { previousUsers };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousUsers) {
        this.queryClient.setQueryData(['users'], context.previousUsers);
      }
    },

    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['users'] });
    },

    onSuccess: () => {
      this.closeDialog();
    },
  }));

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

  /**
   * Open dialog for adding a new user
   */
  openAddDialog(): void {
    this.isEditMode.set(false);
    this.editingUser.set(null);
    this.userForm.reset();
    this.dialogOpen.set(true);
  }

  /**
   * Open dialog for editing an existing user
   */
  openEditDialog(user: User): void {
    this.isEditMode.set(true);
    this.editingUser.set(user);

    // Pre-fill form with user data
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
    });

    this.dialogOpen.set(true);
  }

  /**
   * Close dialog and reset form
   */
  closeDialog(): void {
    this.dialogOpen.set(false);
    this.userForm.reset();
    this.isEditMode.set(false);
    this.editingUser.set(null);
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.getRawValue();

      if (this.isEditMode() && this.editingUser()) {
        // Update existing user
        this.updateUserMutation.mutate({
          id: this.editingUser()!.id,
          data: formData,
        });
      } else {
        // Create new user
        this.createUserMutation.mutate(formData);
      }
    }
  }

  /**
   * Get field validation error message
   */
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

  /**
   * Check if mutation is in progress
   */
  protected get isSaving(): boolean {
    return this.createUserMutation.isPending() || this.updateUserMutation.isPending();
  }
}

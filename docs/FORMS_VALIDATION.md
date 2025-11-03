# Forms and Validation Guide

This guide covers how to use Angular Typed Forms with Zod validation in this template.

## Overview

The template uses:
- **Angular Typed Forms** for compile-time type safety
- **Zod** for runtime validation
- Custom validators to bridge the two

## Basic Example

```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { z } from 'zod';
import { zodValidator } from './shared/utils/form.utils';

// Define Zod schema
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

type UserFormData = z.infer<typeof userSchema>;

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <div>
        <label for="name">Name</label>
        <input id="name" formControlName="name" />
        @if (getFieldError('name')) {
          <span class="error">{{ getFieldError('name') }}</span>
        }
      </div>

      <div>
        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" />
        @if (getFieldError('email')) {
          <span class="error">{{ getFieldError('email') }}</span>
        }
      </div>

      <div>
        <label for="age">Age</label>
        <input id="age" type="number" formControlName="age" />
        @if (getFieldError('age')) {
          <span class="error">{{ getFieldError('age') }}</span>
        }
      </div>

      <button type="submit" [disabled]="!userForm.valid">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  userForm = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, zodValidator(userSchema.shape.name)],
      nonNullable: true,
    }),
    email: new FormControl('', {
      validators: [Validators.required, zodValidator(userSchema.shape.email)],
      nonNullable: true,
    }),
    age: new FormControl(0, {
      validators: [Validators.required, zodValidator(userSchema.shape.age)],
      nonNullable: true,
    }),
  });

  onSubmit() {
    if (this.userForm.valid) {
      const formData: UserFormData = this.userForm.getRawValue();
      console.log('Form data:', formData);
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
```

## Predefined Schemas

The template includes common validation schemas in `src/app/shared/validators/schemas.ts`:

```typescript
import {
  emailSchema,
  passwordSchema,
  urlSchema,
  phoneSchema,
  requiredStringSchema,
  positiveNumberSchema,
  loginFormSchema,
  registrationFormSchema,
} from './shared/validators/schemas';
```

### Example: Using Predefined Schemas

```typescript
const userForm = new FormGroup({
  email: new FormControl('', zodValidator(emailSchema)),
  password: new FormControl('', zodValidator(passwordSchema)),
});
```

## Complex Validation

### Cross-Field Validation

```typescript
const passwordFormSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Use in form
const form = new FormGroup({
  password: new FormControl('', zodValidator(passwordFormSchema.shape.password)),
  confirmPassword: new FormControl('', zodValidator(passwordFormSchema.shape.confirmPassword)),
});
```

### Conditional Validation

```typescript
const orderSchema = z.object({
  deliveryType: z.enum(['pickup', 'delivery']),
  address: z.string().optional(),
}).refine(
  (data) => data.deliveryType !== 'delivery' || (data.address && data.address.length > 0),
  {
    message: 'Address is required for delivery',
    path: ['address'],
  }
);
```

### Async Validation

For async validation (like checking if a username is available), use Angular's async validators:

```typescript
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of, delay, map } from 'rxjs';

function usernameAvailableValidator(apiService: ApiService) {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return of(null);
    }

    return apiService.get<{ available: boolean }>(`/check-username/${control.value}`).pipe(
      delay(500), // Debounce
      map(result => result.available ? null : { usernameTaken: 'Username is already taken' })
    );
  };
}

// Use in form
const form = new FormGroup({
  username: new FormControl('', {
    validators: [zodValidator(requiredStringSchema)],
    asyncValidators: [usernameAvailableValidator(apiService)],
  }),
});
```

## Form Utilities

The template provides helpful utilities in `src/app/shared/utils/form.utils.ts`:

### Mark All Fields as Touched

Useful for showing all validation errors on submit:

```typescript
import { markFormGroupTouched } from './shared/utils/form.utils';

onSubmit() {
  if (this.userForm.invalid) {
    markFormGroupTouched(this.userForm);
    return;
  }
  // Process form
}
```

### Get Control Errors

```typescript
import { getControlErrors } from './shared/utils/form.utils';

const errors = getControlErrors(this.userForm.get('email'));
console.log(errors); // ['Invalid email address']
```

### Should Show Error

```typescript
import { shouldShowError } from './shared/utils/form.utils';

const showError = shouldShowError(this.userForm.get('email'));
```

## Best Practices

### 1. Define Schema Once

```typescript
// schemas/user.schema.ts
export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type User = z.infer<typeof userSchema>;

// Use in multiple places
import { userSchema, User } from './schemas/user.schema';
```

### 2. Reuse Validation Logic

```typescript
// Common password validation
export const strongPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');
```

### 3. Type-Safe Form Values

```typescript
const formData = this.userForm.getRawValue();
// formData is fully typed based on your form definition
```

### 4. Handle Validation Errors Gracefully

```typescript
@if (getFieldError('email')) {
  <p class="mt-1 text-sm text-error">
    {{ getFieldError('email') }}
  </p>
}
```

### 5. Disable Submit Button When Invalid

```typescript
<button
  type="submit"
  [disabled]="!userForm.valid"
  [class.opacity-50]="!userForm.valid"
  [class.cursor-not-allowed]="!userForm.valid"
>
  Submit
</button>
```

## Integration with TanStack Query

For creating/updating data, use TanStack Mutation:

```typescript
import { injectMutation } from '@tanstack/angular-query-experimental';
import { ApiService } from './core/http/api.service';

export class UserFormComponent {
  private apiService = inject(ApiService);

  createUserMutation = injectMutation(() => ({
    mutationFn: (user: UserFormData) =>
      this.apiService.post<User>('/users', user),
    onSuccess: () => {
      console.log('User created successfully');
      this.userForm.reset();
    },
    onError: (error) => {
      console.error('Error creating user:', error);
    },
  }));

  onSubmit() {
    if (this.userForm.valid) {
      const formData = this.userForm.getRawValue();
      this.createUserMutation.mutate(formData);
    }
  }
}
```

## Testing Forms

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate email field', () => {
    const emailControl = component.userForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.invalid).toBe(true);

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBe(true);
  });

  it('should not submit invalid form', () => {
    spyOn(component, 'onSubmit');
    component.userForm.patchValue({
      name: '',
      email: 'invalid',
    });

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    submitButton.click();

    expect(component.userForm.invalid).toBe(true);
  });
});
```

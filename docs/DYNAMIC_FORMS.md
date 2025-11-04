# Dynamic Forms Guide

This guide covers the **Dynamic Form** component that automatically generates forms from Zod schemas.

## Overview

The Dynamic Form component uses **Zod schema introspection** to automatically generate fully-validated forms without writing repetitive boilerplate code.

### Benefits

1. **Less Code**: Define your schema once, get a complete form
2. **Type Safety**: Full TypeScript support from schema to submission
3. **Consistent UI**: All forms follow the same styling patterns
4. **Automatic Validation**: Zod validates at runtime
5. **Rapid Development**: Build forms in minutes, not hours

## Basic Usage

### Step 1: Define Your Zod Schema

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
  role: z.enum(['Admin', 'User', 'Guest']),
});

type UserFormData = z.infer<typeof userSchema>;
```

### Step 2: Create Form Configuration

```typescript
import { DynamicFormConfig } from './shared/components/dynamic-form';

const formConfig: DynamicFormConfig<typeof userSchema.shape> = {
  schema: userSchema,
  submitLabel: 'Save User',
  showCancel: true,
};
```

### Step 3: Use the Component

```html
<app-dynamic-form
  [config]="formConfig"
  (formSubmit)="onSubmit($event)"
  (formCancel)="onCancel()"
/>
```

### Step 4: Handle Submission

```typescript
onSubmit(data: UserFormData): void {
  // data is fully typed!
  console.log(data.name);  // string
  console.log(data.email); // string
  console.log(data.age);   // number
  console.log(data.role);  // 'Admin' | 'User' | 'Guest'
}
```

## Supported Field Types

The dynamic form automatically infers field types from your Zod schema:

### Phase 1 Types

| Zod Type | Rendered As | Example |
|----------|-------------|---------|
| `z.string()` | Text input | `<input type="text">` |
| `z.string().email()` | Email input | `<input type="email">` |
| `z.number()` | Number input | `<input type="number">` |
| `z.boolean()` | Checkbox | `<input type="checkbox">` |
| `z.enum([...])` | Select dropdown | `<select>` |
| `z.string().describe('...\|textarea')` | Textarea | `<textarea>` |

### Phase 2 Types

| Zod Type | Rendered As | Example |
|----------|-------------|---------|
| `z.string().describe('...\|date')` | Date picker | `<input type="date">` |
| `z.string().describe('...\|time')` | Time input | `<input type="time">` |
| `z.string().datetime()` | DateTime picker | `<input type="datetime-local">` |
| `z.string().url()` | URL input | `<input type="url">` |
| `z.string().describe('...\|phone')` | Phone input | `<input type="tel">` |
| `z.string().describe('...\|password')` | Password input | `<input type="password">` |
| `z.object({...})` | Nested fields | Grouped fields with border |
| `z.array(...)` | Dynamic list | Add/remove buttons |

## Adding Labels and Hints

Use Zod's `.describe()` method to add labels and hints:

```typescript
const schema = z.object({
  // Format: "Label|Hint"
  email: z.string().email().describe('Email Address|We will never share your email'),

  // Just label (no hint)
  name: z.string().describe('Full Name'),
});
```

The dynamic form will parse this and display:
- **Label**: "Email Address" (bold)
- **Hint**: "We will never share your email" (gray, small text below input)

## Customizing Fields

You can override auto-generated field configurations:

```typescript
const formConfig: DynamicFormConfig<typeof schema.shape> = {
  schema: userSchema,
  fields: {
    email: {
      placeholder: 'john@example.com',
      hint: 'Custom hint text',
    },
    role: {
      placeholder: 'Select a role',
    },
  },
};
```

## Validation

### Automatic Validation

Validation is automatic based on your Zod schema:

```typescript
const schema = z.object({
  email: z.string().email('Invalid email'),       // Email format validation
  password: z.string().min(8, 'Too short'),       // Min length validation
  age: z.number().min(18).max(100),               // Range validation
  username: z.string().regex(/^[a-z0-9]+$/),      // Pattern validation
});
```

### Validation Constraints

The dynamic form recognizes these Zod constraints:

- `min()` / `max()` - For strings (minLength/maxLength) and numbers (min/max)
- `email()` - Changes input type to email
- `optional()` - Makes field non-required
- Custom error messages in Zod are automatically displayed

## Pre-filling Data (Edit Mode)

Pass initial data to pre-fill the form:

```typescript
const existingUser = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  role: 'Admin' as const,
};
```

```html
<app-dynamic-form
  [config]="formConfig"
  [initialData]="existingUser"
  (formSubmit)="onUpdate($event)"
/>
```

## Loading States

Show a loading spinner during async operations:

```html
<app-dynamic-form
  [config]="formConfig"
  [loading]="isSaving"
  (formSubmit)="onSubmit($event)"
/>
```

When `loading` is true:
- Form fields are disabled
- Submit button shows spinner
- Form cannot be submitted

## Complete Example: User CRUD

```typescript
import { Component, signal } from '@angular/core';
import { z } from 'zod';
import { DynamicFormComponent, DynamicFormConfig } from './shared/components/dynamic-form';

// Schema
const userSchema = z.object({
  name: z.string().min(1).describe('Full Name|Enter the user\'s full name'),
  email: z.string().email().describe('Email Address'),
  role: z.enum(['Admin', 'User', 'Guest']).describe('Role|Select user permissions'),
});

type UserFormData = z.infer<typeof userSchema>;

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [DynamicFormComponent],
  template: `
    <div class="max-w-md mx-auto mt-8">
      <h2 class="text-2xl font-bold mb-4">
        {{ editMode() ? 'Edit User' : 'Create User' }}
      </h2>

      <app-dynamic-form
        [config]="formConfig"
        [initialData]="editMode() ? currentUser() : undefined"
        [loading]="isSaving()"
        (formSubmit)="onSubmit($event)"
        (formCancel)="onCancel()"
      />
    </div>
  `,
})
export class UserFormComponent {
  editMode = signal(false);
  currentUser = signal<UserFormData | null>(null);
  isSaving = signal(false);

  formConfig: DynamicFormConfig<typeof userSchema.shape> = {
    schema: userSchema,
    fields: {
      role: {
        placeholder: 'Choose a role',
      },
    },
    submitLabel: 'Save User',
  };

  onSubmit(data: UserFormData): void {
    this.isSaving.set(true);

    // Simulate API call
    setTimeout(() => {
      console.log('User saved:', data);
      this.isSaving.set(false);
    }, 1000);
  }

  onCancel(): void {
    console.log('Form cancelled');
  }
}
```

## API Reference

### DynamicFormComponent Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `DynamicFormConfig` | **Required** | Form configuration with schema |
| `initialData` | `Partial<T>` | `undefined` | Pre-fill data for edit mode |
| `loading` | `boolean` | `false` | Show loading state |

### DynamicFormComponent Outputs

| Output | Type | Description |
|--------|------|-------------|
| `formSubmit` | `EventEmitter<T>` | Emits when form is submitted with valid data |
| `formCancel` | `EventEmitter<void>` | Emits when cancel button is clicked |

### DynamicFormConfig

```typescript
interface DynamicFormConfig<T> {
  schema: z.ZodObject<T>;
  fields?: Partial<Record<keyof T, Partial<FieldConfig>>>;
  submitLabel?: string;
  showCancel?: boolean;
  cancelLabel?: string;
}
```

### FieldConfig

```typescript
interface FieldConfig {
  name: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  defaultValue?: any;

  // Phase 2: Nested objects
  schema?: z.ZodObject<any>;
  fields?: FieldConfig[];

  // Phase 2: Arrays
  itemSchema?: z.ZodTypeAny;
  itemFields?: FieldConfig;
  minItems?: number;
  maxItems?: number;

  // Phase 2: Conditional visibility
  condition?: FieldCondition;
}

type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'url'
  | 'tel'
  | 'password'
  | 'object'
  | 'array';

interface FieldCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'truthy' | 'falsy';
  value?: any;
}
```

## Comparison: Manual vs Dynamic Forms

### Manual Form (Before)

```typescript
// 1. Define schema
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['Admin', 'User']),
});

// 2. Create FormGroup
const form = new FormGroup({
  name: new FormControl('', Validators.required),
  email: new FormControl('', [Validators.required, Validators.email]),
  role: new FormControl('', Validators.required),
});

// 3. Write template (50+ lines)
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div>
    <label>Name</label>
    <input formControlName="name" />
    @if (form.get('name')?.invalid) {
      <span>{{ getError('name') }}</span>
    }
  </div>
  <!-- Repeat for each field... -->
</form>
```

**Total: ~100 lines of code**

### Dynamic Form (After)

```typescript
const schema = z.object({
  name: z.string().min(1).describe('Name'),
  email: z.string().email().describe('Email'),
  role: z.enum(['Admin', 'User']).describe('Role'),
});

const config = { schema, submitLabel: 'Save' };
```

```html
<app-dynamic-form
  [config]="config"
  (formSubmit)="onSubmit($event)"
/>
```

**Total: ~15 lines of code** ✨

## Phase 2: Advanced Features

Phase 2 adds powerful capabilities for complex forms:

### Nested Objects

Group related fields into nested objects:

```typescript
const addressSchema = z.object({
  street: z.string().describe('Street Address'),
  city: z.string().describe('City'),
  state: z.string().describe('State'),
  zipCode: z.string().describe('ZIP Code'),
});

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: addressSchema.describe('Address|Your mailing address'),
});
```

The dynamic form automatically renders nested objects with visual grouping.

### Array Fields

Create dynamic lists with add/remove functionality:

```typescript
// Primitive arrays
const schema = z.object({
  name: z.string(),
  skills: z.array(z.string()).min(1).max(10).describe('Skills'),
  tags: z.array(z.string()).describe('Tags'),
});

// Object arrays
const contactSchema = z.object({
  name: z.string().describe('Contact Name'),
  phone: z.string().describe('Phone Number'),
  relationship: z.string().describe('Relationship'),
});

const schema = z.object({
  name: z.string(),
  emergencyContacts: z.array(contactSchema)
    .min(1)
    .max(3)
    .describe('Emergency Contacts|At least one required'),
});
```

**Features:**
- Add/remove buttons
- Min/max constraints enforcement
- Supports both primitive and object arrays
- Visual grouping with borders

### Conditional Fields

Show/hide fields based on other field values:

```typescript
const schema = z.object({
  employmentType: z.enum(['Full-Time', 'Part-Time', 'Contract']),
  salary: z.number().optional(),
  hourlyRate: z.number().optional(),
  hasShippingAddress: z.boolean(),
  shippingAddress: z.object({...}).optional(),
});

const config: DynamicFormConfig<typeof schema.shape> = {
  schema,
  fields: {
    // Show salary only for Full-Time
    salary: {
      condition: {
        field: 'employmentType',
        operator: 'equals',
        value: 'Full-Time',
      },
    },
    // Show hourly rate only for Contract
    hourlyRate: {
      condition: {
        field: 'employmentType',
        operator: 'equals',
        value: 'Contract',
      },
    },
    // Show shipping address when checkbox is checked
    shippingAddress: {
      condition: {
        field: 'hasShippingAddress',
        operator: 'truthy',
      },
    },
  },
};
```

**Supported Operators:**
- `equals` - Exact match
- `notEquals` - Not equal to value
- `contains` - String or array contains value
- `greaterThan` - Numeric comparison
- `lessThan` - Numeric comparison
- `truthy` - Field has truthy value
- `falsy` - Field has falsy value

### Advanced Field Types

Phase 2 adds support for more HTML5 input types:

| Type | Usage | Example |
|------|-------|---------|
| `date` | Date picker | `z.string().describe('Birth Date\|date')` |
| `time` | Time input | `z.string().describe('Meeting Time\|time')` |
| `datetime-local` | Date and time | `z.string().datetime()` |
| `url` | URL validation | `z.string().url()` |
| `tel` | Phone number | `z.string().describe('Phone\|phone')` |
| `password` | Password input | `z.string().describe('Password\|password')` |
| `textarea` | Multi-line text | `z.string().describe('Bio\|textarea')` |

**Note:** Field types can be inferred from Zod validators (`.url()`, `.datetime()`) or from description hints.

### Complete Phase 2 Example

```typescript
const employeeSchema = z.object({
  // Basic info
  firstName: z.string().min(1).describe('First Name'),
  lastName: z.string().min(1).describe('Last Name'),
  email: z.string().email().describe('Email Address'),
  phone: z.string().describe('Phone Number|phone'),
  birthDate: z.string().describe('Birth Date|date'),

  // Employment
  employmentType: z.enum(['Full-Time', 'Part-Time', 'Contract'])
    .describe('Employment Type'),
  salary: z.number().min(0).optional().describe('Annual Salary'),

  // Nested address
  address: z.object({
    street: z.string().min(1).describe('Street Address'),
    city: z.string().min(1).describe('City'),
    state: z.string().min(2).max(2).describe('State'),
    zipCode: z.string().min(5).describe('ZIP Code'),
  }).describe('Home Address'),

  // Arrays
  skills: z.array(z.string().min(1))
    .min(1)
    .max(10)
    .describe('Skills'),

  emergencyContacts: z.array(
    z.object({
      name: z.string().min(1).describe('Contact Name'),
      phone: z.string().describe('Phone|phone'),
      relationship: z.string().min(1).describe('Relationship'),
    })
  ).min(1).max(3).describe('Emergency Contacts'),

  // Optional fields
  portfolio: z.string().url().optional().describe('Portfolio|url'),
  bio: z.string().max(500).optional().describe('Bio|textarea'),
});

const config: DynamicFormConfig<typeof employeeSchema.shape> = {
  schema: employeeSchema,
  fields: {
    salary: {
      condition: {
        field: 'employmentType',
        operator: 'contains',
        value: 'Full-Time',
      },
    },
  },
  submitLabel: 'Register Employee',
  showCancel: true,
};
```

## Live Demo

Visit the **Phase 2 Demo** at `/phase2` to see all advanced features in action with a complete employee registration form.

## Phase 3: Layouts, Groups & Multi-Step Forms

Phase 3 introduces powerful organization and navigation features:

### Grid Layouts

Create responsive grid layouts with customizable columns:

```typescript
const config: DynamicFormConfig<typeof schema.shape> = {
  schema,
  layout: 'grid',
  columns: 3, // 3-column grid
  fields: {
    email: { colSpan: 3 }, // Full width
    firstName: { colSpan: 1 }, // Default: 1 column
    lastName: { colSpan: 1 },
    city: { colSpan: 2 }, // Spans 2 columns
  },
};
```

**Supported Layouts:**
- `vertical` (default) - Stack fields vertically
- `horizontal` - Arrange fields in a flex row
- `grid` - Responsive grid with customizable columns

**Column Spanning:**
- Use `colSpan` to control field width in grid layout
- Values from 1-12 (following Tailwind's grid system)
- Automatically responsive (single column on mobile)

### Field Groups

Organize fields into collapsible sections:

```typescript
const config: DynamicFormConfig<typeof schema.shape> = {
  schema,
  fields: {
    firstName: { group: 'personal' },
    lastName: { group: 'personal' },
    email: { group: 'personal' },

    street: { group: 'address' },
    city: { group: 'address' },
    state: { group: 'address' },
  },
  groups: [
    {
      id: 'personal',
      title: '👤 Personal Information',
      description: 'Your basic contact details',
      collapsible: true,
      collapsed: false, // Initially expanded
    },
    {
      id: 'address',
      title: '🏠 Address',
      description: 'Where can we reach you?',
      collapsible: true,
      collapsed: true, // Initially collapsed
    },
  ],
};
```

**Group Features:**
- Visual separation with borders
- Optional icons for better UX
- Collapsible sections (click header to toggle)
- Group descriptions
- Can combine with grid layout

### Multi-Step Wizard Forms

Break long forms into manageable steps:

```typescript
const config: DynamicFormConfig<typeof schema.shape> = {
  schema,
  steps: [
    {
      id: 'step1',
      title: 'Personal Info',
      description: 'Tell us about yourself',
      fields: ['firstName', 'lastName', 'email'],
      icon: '👤',
      validate: true, // Validate before proceeding (default)
    },
    {
      id: 'step2',
      title: 'Address',
      description: 'Where do you live?',
      fields: ['street', 'city', 'state', 'zipCode'],
      icon: '🏠',
    },
    {
      id: 'step3',
      title: 'Account',
      description: 'Create your account',
      fields: ['username', 'password'],
      icon: '🔐',
    },
  ],
  showStepProgress: true, // Show progress indicator
};
```

**Wizard Features:**
- Progress indicator with step numbers
- Step titles and descriptions
- Back/Next navigation buttons
- Per-step validation before proceeding
- Checkmark icons for completed steps
- Submit button appears on last step only
- Optional icons for each step

**Step Validation:**
- Set `validate: false` to allow proceeding without validation
- Default is `true` - validates all fields in current step
- Invalid fields are marked as touched when user tries to proceed

### Complete Phase 3 Example

```typescript
const schema = z.object({
  // Personal
  firstName: z.string().min(1).describe('First Name'),
  lastName: z.string().min(1).describe('Last Name'),
  email: z.string().email().describe('Email'),

  // Address
  street: z.string().describe('Street'),
  city: z.string().describe('City'),
  state: z.string().describe('State'),

  // Account
  username: z.string().min(3).describe('Username'),
  password: z.string().min(8).describe('Password|password'),
});

// Multi-step with grid layout
const config: DynamicFormConfig<typeof schema.shape> = {
  schema,
  layout: 'grid',
  columns: 2,
  steps: [
    {
      id: 'personal',
      title: 'Personal Info',
      fields: ['firstName', 'lastName', 'email'],
    },
    {
      id: 'address',
      title: 'Address',
      fields: ['street', 'city', 'state'],
    },
    {
      id: 'account',
      title: 'Account',
      fields: ['username', 'password'],
    },
  ],
  fields: {
    email: { colSpan: 2 }, // Full width in grid
  },
};
```

**Live Demos:**
- Visit `/phase3` to see all Phase 3 features
- Try the multi-step wizard
- Experiment with grid layouts
- Test collapsible field groups

## Best Practices

1. **Use `.describe()` for User-Friendly Labels**
   ```typescript
   // Bad
   firstName: z.string()

   // Good
   firstName: z.string().describe('First Name|Enter your legal first name')
   ```

2. **Provide Specific Error Messages**
   ```typescript
   // Bad
   age: z.number()

   // Good
   age: z.number()
     .min(18, 'You must be at least 18 years old')
     .max(120, 'Please enter a valid age')
   ```

3. **Use Enums for Select Fields**
   ```typescript
   // The dynamic form automatically creates a dropdown
   role: z.enum(['Admin', 'Editor', 'Viewer'])
   ```

4. **Customize When Needed**
   ```typescript
   fields: {
     password: {
       hint: 'Must be at least 8 characters with 1 uppercase and 1 number',
     },
   }
   ```

## Integration with TanStack Query

Dynamic forms work perfectly with TanStack Query mutations:

```typescript
const createUserMutation = injectMutation(() => ({
  mutationFn: (userData: UserFormData) =>
    apiService.post('/users', userData),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
}));

onSubmit(data: UserFormData): void {
  this.createUserMutation.mutate(data);
}
```

```html
<app-dynamic-form
  [config]="formConfig"
  [loading]="createUserMutation.isPending()"
  (formSubmit)="onSubmit($event)"
/>
```

## Troubleshooting

### Fields Not Showing

Ensure your schema is properly typed:
```typescript
// Wrong
const schema: any = z.object({...});

// Correct
const schema = z.object({...});
```

### Type Errors

Make sure to use `z.infer` for type safety:
```typescript
type FormData = z.infer<typeof schema>;

onSubmit(data: FormData): void {
  // data is now fully typed
}
```

### Validation Not Working

Check that your validators are in the schema:
```typescript
// Wrong - validators outside schema
const schema = z.object({ email: z.string() });
form.get('email')?.addValidators(Validators.email);

// Correct - validators in schema
const schema = z.object({ email: z.string().email() });
```

## See Also

- [Forms and Validation Guide](./FORMS_VALIDATION.md)
- [UI Components Guide](./UI_COMPONENTS.md)
- [Zod Documentation](https://zod.dev/)

import { z } from 'zod';

/**
 * Common Zod schemas for validation
 * Use these with Angular Typed Forms
 */

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// URL validation
export const urlSchema = z.string().url('Invalid URL');

// Phone number validation (US format)
export const phoneSchema = z
  .string()
  .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number');

// Required string validation
export const requiredStringSchema = z
  .string()
  .min(1, 'This field is required')
  .trim();

// Positive number validation
export const positiveNumberSchema = z
  .number()
  .positive('Must be a positive number');

// Date range validation
export const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(
  (data) => data.end >= data.start,
  {
    message: 'End date must be after start date',
    path: ['end'],
  }
);

/**
 * Example: Login form schema
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

/**
 * Example: User registration schema
 */
export const registrationFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: requiredStringSchema,
  lastName: requiredStringSchema,
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type RegistrationFormData = z.infer<typeof registrationFormSchema>;

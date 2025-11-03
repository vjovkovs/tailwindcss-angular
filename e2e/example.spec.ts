import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E tests for the example feature
 */
test.describe('Example Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the users table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should open the add user dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add New User' })).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: 'Add User' }).last();
    await expect(submitButton).toBeDisabled();

    // Fill in name
    await page.getByLabel('Name').fill('Test User');

    // Fill in invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Email').blur();

    // Should still be disabled due to invalid email
    await expect(submitButton).toBeDisabled();
  });

  test('should close dialog on cancel', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close dialog on escape key', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

/**
 * Accessibility tests
 */
test.describe('Accessibility @a11y', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dialog should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add User' }).click();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should trap focus in dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add User' }).click();

    // Focus should be trapped in the dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeFocused();
  });

  test('should restore focus after closing dialog', async ({ page }) => {
    await page.goto('/');
    const addButton = page.getByRole('button', { name: 'Add User' });
    await addButton.click();

    await page.keyboard.press('Escape');

    // Focus should return to the trigger button
    await expect(addButton).toBeFocused();
  });
});

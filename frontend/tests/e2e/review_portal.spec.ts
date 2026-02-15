import { test, expect } from '@playwright/test';

test.describe('Review Portal', () => {
    // We assume the user navigates here layout after recording, 
    // but for testing we can go directly to the page since it uses mock data.

    test.beforeEach(async ({ page }) => {
        // Mock local storage for Thread ID
        await page.addInitScript(() => {
            localStorage.setItem('DigitalThreadStart', 'mock_hash_123456');
        });
        await page.goto('http://localhost:3000/audit/review');
    });

    test('should display findings and thread ID', async ({ page }) => {
        await expect(page.getByText('Audit Review')).toBeVisible();
        await expect(page.getByText('Thread ID: MOCK_HAS-3456')).toBeVisible();
        await expect(page.getByText('EVACUATION HAZARD')).toBeVisible();
    });

    test('should allow accepting a finding', async ({ page }) => {
        await page.getByRole('button', { name: 'Accept Finding' }).click();
        await expect(page.getByText('✓ Accepted')).toBeVisible();
    });

    test('should allow overriding a finding', async ({ page }) => {
        // Ensure button is visible first
        const rejectBtn = page.getByRole('button', { name: /Reject.*Downgrade/i });
        await expect(rejectBtn).toBeVisible();
        await rejectBtn.click();

        // Modal should appear
        await expect(page.getByText('Regulatory Override Justification')).toBeVisible();

        // Fill justification
        await page.getByPlaceholder('Type justification here').fill('Fire Marshall says it is fine.');
        await page.getByRole('button', { name: 'Confirm Override' }).click();

        // Check result
        await expect(page.getByText('Overridden by Responsible Person')).toBeVisible();
        await expect(page.getByText('"Fire Marshall says it is fine."')).toBeVisible();
    });

    test('should enable submit button only when all reviewed', async ({ page }) => {
        // Initially, finding are pending. Button text is 'Review all items to submit'
        const initialBtn = page.getByRole('button', { name: /Review all items.*/i });
        await expect(initialBtn).toBeDisabled();

        // There are 3 findings in mock data. Review them all.
        // 1. Accept first (auto-advances to second)
        await page.getByRole('button', { name: 'Accept Finding' }).click();

        // 2. Accept second (auto-advances to third)
        await page.getByRole('button', { name: 'Accept Finding' }).click();

        // 3. Accept third
        await page.getByRole('button', { name: 'Accept Finding' }).click();

        // Now button text changes to 'submit to SIA'
        const submitBtn = page.getByRole('button', { name: /submit to SIA/i });
        await expect(submitBtn).toBeEnabled();
    });
});

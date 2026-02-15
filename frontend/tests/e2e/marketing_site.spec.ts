import { test, expect } from '@playwright/test';

test.describe('Marketing Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/');
    });

    test('should load the hero section', async ({ page }) => {
        await expect(page).toHaveTitle(/Martyn's Law Compliance/);
        await expect(page.getByText('Compliance in a Walkthrough')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
    });

    test('should display and interact with Tier Checker', async ({ page }) => {
        // Scroll to Tier Checker
        const tierSection = page.locator('#check-tier');
        await tierSection.scrollIntoViewIfNeeded();

        // Input capacity (Low)
        await page.getByPlaceholder('e.g. 350').fill('150');
        await page.getByRole('button', { name: 'Check My Tier' }).click();
        await expect(page.getByText('EXEMPT')).toBeVisible();

        // Input capacity (Standard)
        await page.getByPlaceholder('e.g. 350').fill('350');
        await page.getByRole('button', { name: 'Check My Tier' }).click();
        await expect(page.getByText('STANDARD TIER')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Start Free Assessment Now' })).toBeVisible();
    });

    test('should display Reasonably Practicable slider', async ({ page }) => {
        await expect(page.getByText('The "Reasonably Practicable" Engine')).toBeVisible();

        // Check initial state (Low Budget -> Required)
        await expect(page.getByText('REQUIRED')).toBeVisible();

        // Simulate slider change (High Budget -> Optional)
        const slider = page.locator('input[type="range"]');
        await slider.fill('5000');
        await expect(page.getByText('OPTIONAL')).toBeVisible();
        // Note: React state update might be instant, but in real app we'd wait. 
        // The visualizer mock logic switches at > 1000.
    });

    test('should render Terminator Vision demo', async ({ page }) => {
        await expect(page.getByText('See Risks. Instantly.')).toBeVisible();
        await expect(page.getByText('AI_MODEL: CLAUDE-3.5-SONNET')).toBeVisible();
        await expect(page.getByText('BLOCKED EGRESS (CRITICAL)')).toBeVisible();
    });
});

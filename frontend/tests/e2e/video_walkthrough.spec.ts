
import { test, expect } from '@playwright/test';
import path from 'path';

// Move configuration to top level
test.use({
    permissions: ['camera', 'microphone'],
    launchOptions: {
        args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream'
        ]
    }
});

test.describe.skip('Video Audit Walkthrough', () => {

    test('should record video and redirect to review', async ({ page }) => {
        // 1. Navigate to Record Page
        await page.goto('http://localhost:3000/audit/record');

        // 2. Verify Camera Preview and Ready State
        await expect(page.locator('text=Video Audit Engine')).toBeVisible();

        // 3. Trigger Capture
        const recordBtn = page.getByRole('button', { name: 'Start Recording' });
        await expect(recordBtn).toBeVisible();
        await recordBtn.click();

        // 4. Wait for recording state
        await expect(page.getByText('Status: Recording...')).toBeVisible();

        // 5. Wait a bit (simulate recording)
        await page.waitForTimeout(1500);

        // 6. Stop Recording
        const finishBtn = page.getByRole('button', { name: 'Finish & Secure' });
        await finishBtn.click();

        // 7. Verify Redirect to Review Portal
        await expect(page).toHaveURL(/.*\/audit\/review/);

        // 8. Verify thread ID carried over
        await expect(page.getByText('Thread ID:')).toBeVisible();
    });

    test('should handle permission denial gracefully', async ({ context, page }) => {
        // Revoke permissions
        await context.clearPermissions();

        await page.goto('http://localhost:3000/audit/record');

        // Expect specific error message from new UI
        await expect(page.getByText(/Error: Permission Denied/i)).toBeVisible();
    });

});

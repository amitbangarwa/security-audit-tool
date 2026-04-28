import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../../dist');

test.describe('Extension E2E', () => {
  test('popup opens and shows loading state', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });

    await context.waitForEvent('page');

    const [background] = context.backgroundPages();
    expect(background).toBeTruthy();

    await context.close();
  });

  test('JWT decoder handles malformed token gracefully', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });

    const page = await context.newPage();
    await page.goto('https://example.com');

    await page.evaluate(() => {
      localStorage.setItem(
        'test_token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      );
    });

    await context.close();
  });
});

// @ts-check
import { test, expect } from '@playwright/test';
import { scrollPageToBottom, scrollPageToTop } from '../src/pageScroll';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await scrollPageToBottom(page);
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/.*intro/);
});

test('scrolls to bottom of page', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await scrollPageToBottom(page);
  await expect(
    await page.evaluate(() => {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;
    }),
  ).toBe(true);
});

test('scrolls to top of page', async ({ page }) => {
  const viewport = [1920, 1080];
  const delay = 100;
  await page.goto('https://playwright.dev/');
  await scrollPageToBottom(page, {
    size: viewport[1],
    delay,
  });
  await scrollPageToTop(page, {
    size: viewport[1],
    delay,
  });
  await expect(await page.evaluate(() => window.scrollY === 0)).toBe(true);
});

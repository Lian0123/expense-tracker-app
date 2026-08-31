import { expect, test } from '@playwright/test';

test('serves crawlable Chinese and English landing pages from the Pages base path', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page).toHaveTitle(/日常記帳/);
  await expect(page.getByRole('heading', { name: /讓每一筆/ })).toBeVisible();

  await page.goto('en/');
  await expect(page).toHaveTitle(/Daily Ledger/);
  await expect(page.getByRole('heading', { name: 'A kinder way to keep track.' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/$/);
});

test('records, persists, sorts and creates a custom category', async ({ page }) => {
  await page.goto('app/?mode=companion');
  await expect(page.getByRole('heading', { name: '一週支出合計' })).toBeVisible();
  await page.locator('.app-companion .mascot').hover();
  await expect(page.getByText('摸摸我！一起把今天的小事記下來吧。')).toBeVisible();
  await page.getByRole('button', { name: '快速記一筆' }).click();
  await page.getByLabel('金額').fill('100');
  await page.getByLabel('時間（精確到秒）').fill('09:08:07');
  await page.getByLabel('備註').fill('較大的夏日支出');
  await page.getByRole('button', { name: '儲存記錄' }).click();

  await page.getByRole('button', { name: '快速記一筆' }).click();
  await page.getByLabel('金額').fill('20');
  await page.getByLabel('時間（精確到秒）').fill('09:08:08');
  await page.getByLabel('備註').fill('較小的夏日支出');
  await page.getByRole('button', { name: '儲存記錄' }).click();
  await expect(page.getByText('較小的夏日支出', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('較大的夏日支出', { exact: true })).toBeVisible();
  await expect(page.getByText('較小的夏日支出', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '記帳模式' }).click();
  await page.getByLabel('最新優先').selectOption('amount-low');
  await expect(page.locator('.entry-row').first()).toContainText('較小的夏日支出');
  await expect(page.locator('.entry-row').first()).toContainText('09:08:08');

  await page.getByLabel('開始時間').fill('2026-09-01T00:00');
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.getByRole('button', { name: '清除時間篩選' }).click();
  await expect(page.locator('.entry-row')).toHaveCount(2);

  await page.getByRole('button', { name: /管理分類/ }).click();
  await page.getByRole('button', { name: /新增分類/ }).click();
  await page.getByLabel('繁體中文').fill('夏日祭典');
  await page.getByLabel('English').fill('Summer festival');
  await page.getByRole('button', { name: '儲存記錄' }).click();
  await expect(page.getByText('夏日祭典')).toBeVisible();
});

test('keeps animated Hana visible and usable on a 320px phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('app/?mode=companion');
  const mascot = page.locator('.mobile-mascot-preview img');
  await expect(mascot).toBeVisible();
  await expect(mascot).toHaveJSProperty('complete', true);
  expect(await mascot.evaluate((image) => getComputedStyle(image).animationName)).not.toBe('none');
  await expect(page.locator('.mobile-timebar__clock')).toHaveText(/\d{2}:\d{2}:\d{2}/);
  await page.getByRole('button', { name: '打開花水木對話' }).click();
  const dialog = page.getByRole('dialog', { name: '花水木陪伴' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((node) => getComputedStyle(node).zIndex)).toBe('120');
  expect(
    await dialog.locator('.mascot__art').evaluate((node) => getComputedStyle(node).zIndex),
  ).toBe('2');
  await dialog.getByRole('button', { name: '左上角' }).click();
  await expect(page.locator('.mobile-mascot-preview')).toHaveClass(
    /mobile-mascot-preview--top-left/,
  );
  await page.reload();
  await expect(page.locator('.mobile-mascot-preview')).toHaveClass(
    /mobile-mascot-preview--top-left/,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('reopens the production app offline after the first successful load', async ({ page }) => {
  await page.goto('app/?mode=companion');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: '快速記一筆' })).toBeVisible();
  await page.context().setOffline(false);
});

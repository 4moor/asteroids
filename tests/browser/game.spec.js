import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  page.__gameErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect(page.__gameErrors).toEqual([]);
});

test('start screen explains controls and starts a flight', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Готовы к вылету?' })).toBeVisible();
  await expect(page.getByText('Поворот', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Начать полёт', exact: true }).click();
  await expect(page.getByTestId('game-status')).toHaveText('Полёт идёт');
  await expect(page.getByTestId('lives')).toHaveText('3');
  await expect(page.getByRole('button', { name: 'Начать полёт', exact: true })).toBeHidden();
});

test('keyboard thrust and firing update the game state', async ({ page }) => {
  await page.getByRole('button', { name: 'Начать полёт', exact: true }).click();
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => page.evaluate(() => window.__ASTEROIDS_TEST__.getState().ship.vy)).toBeLessThan(-10);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('Space');
  await expect.poll(() => page.evaluate(() => window.__ASTEROIDS_TEST__.getState().bullets.length)).toBeGreaterThan(0);
  await page.keyboard.up('Space');
});

test('pause freezes the simulation and resumes through the button', async ({ page }) => {
  await page.getByRole('button', { name: 'Начать полёт', exact: true }).click();
  await page.keyboard.press('KeyP');
  await expect(page.getByTestId('game-status')).toHaveText('Пауза');
  const before = await page.evaluate(() => window.__ASTEROIDS_TEST__.getState().elapsed);
  // Wait for browser frames, not an arbitrary wall-clock delay.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => window.__ASTEROIDS_TEST__.getState().elapsed)).toBe(before);
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  await expect(page.getByTestId('game-status')).toHaveText('Полёт идёт');
});

test('a reproducible hit updates score in the DOM', async ({ page }) => {
  await page.getByRole('button', { name: 'Начать полёт', exact: true }).click();
  await page.evaluate(() => {
    const api = window.__ASTEROIDS_TEST__;
    const state = api.getState();
    state.asteroids = [
      { id: 100, x: 100, y: 100, vx: 0, vy: 0, size: 1, angle: 0, spin: 0 },
      { id: 101, x: 800, y: 500, vx: 0, vy: 0, size: 3, angle: 0, spin: 0 },
    ];
    state.bullets = [{ id: 102, x: 100, y: 100, vx: 0, vy: 0, ttl: 1 }];
    state.nextId = 103;
    api.setState(state);
    api.advance();
  });
  await expect(page.getByTestId('score')).toHaveText('100');
});

test('game over and restart reset score, lives and asteroid count', async ({ page }) => {
  await page.getByRole('button', { name: 'Начать полёт', exact: true }).click();
  await page.evaluate(() => {
    const api = window.__ASTEROIDS_TEST__;
    const state = api.getState();
    state.lives = 1;
    state.score = 250;
    state.ship.invulnerable = 0;
    state.asteroids = [{ id: 100, x: state.ship.x, y: state.ship.y, vx: 0, vy: 0, size: 3, angle: 0, spin: 0 }];
    api.setState(state);
    api.advance();
  });
  await expect(page.getByRole('heading', { name: 'Полёт завершён' })).toBeVisible();
  await expect(page.getByTestId('lives')).toHaveText('0');
  await page.getByRole('button', { name: 'Начать заново', exact: true }).click();
  await expect(page.getByTestId('score')).toHaveText('0');
  await expect(page.getByTestId('lives')).toHaveText('3');
  await expect(page.getByTestId('field-value')).toHaveText('3');
});

test('layout stays within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Начать полёт', exact: true })).toBeVisible();
});

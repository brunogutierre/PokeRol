import { Locator } from '@playwright/test';
import { expect, test } from './support/mock-api';

test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

/** Emulates a horizontal finger swipe with Pointer Events. */
async function swipe(target: Locator, dx: number): Promise<void> {
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + 40;
  const init = { pointerId: 1, pointerType: 'touch', isPrimary: true, bubbles: true };
  await target.dispatchEvent('pointerdown', { ...init, clientX: x, clientY: y });
  await target.dispatchEvent('pointermove', { ...init, clientX: x + dx / 2, clientY: y });
  await target.dispatchEvent('pointerup', { ...init, clientX: x + dx, clientY: y });
}

test.describe('Swipe navigation', () => {
  test('changes the list page and the detail neighbour', async ({ page }) => {
    await page.goto('/pokemon');
    const grid = page.locator('[appSwipe]');
    await expect(page.locator('app-pokemon-card')).toHaveCount(18);
    await expect(page.getByText('Swipe to change page')).toBeVisible();

    await swipe(grid, -150);
    await expect(page).toHaveURL('/pokemon?page=1');
    await swipe(grid, 150);
    await expect(page).toHaveURL('/pokemon');

    await page.goto('/pokemon/25');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pikachu');
    await swipe(page.locator('article[appSwipe]'), -150);
    await expect(page).toHaveURL('/pokemon/26');
  });
});

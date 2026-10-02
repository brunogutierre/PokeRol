import { expect, test } from './support/mock-api';

test.describe('Pokémon detail', () => {
  test('opens from the list and returns to the same list state', async ({ page }) => {
    await page.goto('/pokemon?type=grass&page=0');
    await page.getByRole('link', { name: 'Ivysaur, #002, Grass, Poison' }).click();

    await expect(page).toHaveURL('/pokemon/2');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ivysaur');
    await expect(page).toHaveTitle('Ivysaur · PokeRol');
    await expect(page.getByRole('img', { name: 'Official artwork of Ivysaur' })).toBeVisible();
    await expect(page.getByRole('meter')).toHaveCount(6);
    await expect(page.getByText('Hidden', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('list', { name: 'Evolution chain' }).getByRole('link', { name: /Ivysaur/ }),
    ).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Next Pokémon, #003' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Venusaur');

    await page.getByRole('link', { name: 'Back to list' }).click();
    await expect(page).toHaveURL('/pokemon?type=grass');
  });

  test('shows the not-found page for unknown Pokémon', async ({ page }) => {
    await page.goto('/pokemon/5000');
    await expect(page.getByRole('heading', { name: 'This Pokémon fled!' })).toBeVisible();
  });
});

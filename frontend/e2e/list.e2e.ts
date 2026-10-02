import { expect, test } from './support/mock-api';

test.describe('Pokédex list', () => {
  test('shows the first page and paginates through the URL', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/pokemon');
    await expect(page).toHaveTitle('Pokédex · PokeRol');

    const cards = page.getByRole('link', { name: /, #\d{3}/ });
    await expect(cards).toHaveCount(18);
    await expect(page.getByRole('link', { name: 'Bulbasaur, #001, Grass, Poison' })).toBeVisible();
    await expect(page.getByText('1025 Pokémon')).toBeVisible();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page).toHaveURL('/pokemon?page=1');
    await expect(page.getByRole('link', { name: /^Pokemon 19, #019/ })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Page number' })).toHaveValue('2');

    await page.getByRole('spinbutton', { name: 'Page number' }).fill('57');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/pokemon?page=56');
    await expect(page.getByRole('button', { name: 'Next page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

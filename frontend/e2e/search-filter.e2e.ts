import { expect, test } from './support/mock-api';

test.describe('Search, filter and sort', () => {
  test('restores the state from a deep link', async ({ page, apiRequests }) => {
    await page.goto('/pokemon?q=char&type=fire&sort=name&dir=desc');

    await expect(page.getByRole('searchbox', { name: 'Search Pokémon' })).toHaveValue('char');
    await expect(page.getByRole('combobox', { name: 'Filter by type' })).toHaveValue('fire');
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('name-desc');
    const names = page.locator('app-pokemon-card .name');
    await expect(names).toHaveText(['Charmeleon', 'Charmander', 'Charizard']);

    const listCall = apiRequests
      .map((r) => new URL(r.url()))
      .find((u) => u.pathname.endsWith('/pokemon'));
    expect(Object.fromEntries(listCall!.searchParams)).toMatchObject({
      q: 'char',
      type: 'fire',
      sort: 'name',
      dir: 'desc',
    });
  });

  test('updates the URL as the user searches and filters', async ({ page }) => {
    await page.goto('/pokemon?page=3');
    await page.getByRole('searchbox', { name: 'Search Pokémon' }).fill('pika');
    await expect(page).toHaveURL('/pokemon?q=pika');
    await expect(page.locator('app-pokemon-card')).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear search' }).click();
    await page.getByRole('combobox', { name: 'Filter by type' }).selectOption('electric');
    await expect(page).toHaveURL('/pokemon?type=electric');
    await expect(page.getByRole('link', { name: 'Pikachu, #025, Electric' })).toBeVisible();

    await page.goto('/pokemon?q=zzzz');
    await expect(page.getByRole('heading', { name: 'No Pokémon found' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).toHaveURL('/pokemon');
  });
});

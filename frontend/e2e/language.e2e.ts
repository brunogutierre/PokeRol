import { expect, test } from './support/mock-api';

test.describe('Language switch', () => {
  test('translates the UI and the data, and remembers the choice', async ({
    page,
    apiRequests,
  }) => {
    await page.goto('/pokemon/1');
    await expect(page.getByText('Seed Pokémon')).toBeVisible();

    await page.getByRole('combobox', { name: 'Language' }).selectOption('fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('link', { name: 'Retour à la liste' })).toBeVisible();
    await expect(page.getByText('Pokémon Graine')).toBeVisible();
    await expect(
      page.getByText("Certaines données ne sont disponibles qu'en anglais."),
    ).toBeVisible();
    expect(apiRequests.some((r) => r.url().includes('/pokemon/1?lang=fr'))).toBe(true);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('combobox', { name: 'Langue' })).toHaveValue('fr');
  });

  test('translates PokeAPI vocabularies by key when the API only has English', async ({ page }) => {
    await page.goto('/pokemon/1');
    await page.getByRole('combobox', { name: 'Language' }).selectOption('pt-BR');
    // The fake API answers pt-BR with English labels, like the real one.
    await expect(page.locator('.types app-type-badge').first()).toHaveText('Planta');
    await expect(page.getByRole('meter', { name: 'Pontos de Saúde' })).toBeVisible();
    await expect(page.getByText('Verde')).toBeVisible();
    await expect(page.getByText('Alguns dados só estão disponíveis em inglês.')).toBeVisible();
  });
});

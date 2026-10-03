import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/mock-api';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`Accessibility (${colorScheme})`, () => {
    test.use({ colorScheme });

    for (const url of ['/pokemon', '/pokemon/2', '/nowhere']) {
      test(`${url} has no axe violations`, async ({ page }) => {
        await page.goto(url);
        await expect(page.locator('main h1')).toBeAttached();
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

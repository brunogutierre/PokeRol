import { Page, Request, test as base } from '@playwright/test';

/** Deterministic fake BFF: 1025 species named after their number, a few known names. */
const NAMES: Record<number, string> = {
  1: 'Bulbasaur',
  2: 'Ivysaur',
  3: 'Venusaur',
  4: 'Charmander',
  5: 'Charmeleon',
  6: 'Charizard',
  25: 'Pikachu',
};
const TYPES: Record<number, string[]> = {
  4: ['fire'],
  5: ['fire'],
  6: ['fire', 'flying'],
  25: ['electric'],
};
const TYPE_NAMES: Record<string, Record<string, string>> = {
  en: { grass: 'Grass', poison: 'Poison', fire: 'Fire', flying: 'Flying', electric: 'Electric' },
  fr: { grass: 'Plante', poison: 'Poison', fire: 'Feu', flying: 'Vol', electric: 'Électrik' },
};
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
  'base64',
);

const nameOf = (id: number) => NAMES[id] ?? `Pokemon ${id}`;

function types(id: number, lang: string) {
  return (TYPES[id] ?? ['grass', 'poison']).map((key) => ({
    key,
    name: TYPE_NAMES[lang]?.[key] ?? key,
  }));
}

function summary(id: number, lang: string) {
  return {
    id,
    name: nameOf(id),
    types: types(id, lang),
    color: 'green',
    spriteUrl: `https://img.test/${id}.png`,
    abilities: [],
  };
}

function list(url: URL) {
  const lang = url.searchParams.get('lang') ?? 'en';
  const page = Number(url.searchParams.get('page') ?? 0);
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const type = url.searchParams.get('type');
  let all = Array.from({ length: 1025 }, (_, i) => summary(i + 1, lang));
  if (q) all = all.filter((p) => p.name.toLowerCase().includes(q) || String(p.id) === q);
  if (type) all = all.filter((p) => p.types.some((t) => t.key === type));
  if (url.searchParams.get('sort') === 'name') all.sort((a, b) => a.name.localeCompare(b.name));
  if (url.searchParams.get('dir') === 'desc') all.reverse();
  return {
    items: all.slice(page * 18, page * 18 + 18),
    page,
    size: 18,
    totalItems: all.length,
    totalPages: Math.ceil(all.length / 18),
    degraded: false,
  };
}

function detail(id: number, lang: string) {
  return {
    id,
    speciesId: id,
    name: nameOf(id),
    genus: lang === 'fr' ? 'Pokémon Graine' : 'Seed Pokémon',
    flavorTexts: ['A strange seed was planted on its back at birth.'],
    types: types(id, lang),
    images: {
      dreamWorld: null,
      artwork: `https://img.test/art/${id}.png`,
      sprite: `https://img.test/${id}.png`,
    },
    stats: [
      ['hp', 'HP', 45],
      ['attack', 'Attack', 49],
      ['defense', 'Defense', 49],
      ['special-attack', 'Sp. Atk', 65],
      ['special-defense', 'Sp. Def', 65],
      ['speed', 'Speed', 45],
    ].map(([key, name, base]) => ({ key, name, base, effort: 0 })),
    abilities: [
      { key: 'overgrow', name: 'Overgrow', hidden: false },
      { key: 'chlorophyll', name: 'Chlorophyll', hidden: true },
    ],
    biology: {
      heightM: 0.7,
      weightKg: 6.9,
      color: { key: 'green', name: 'Green' },
      shape: null,
      habitat: null,
    },
    evolution: {
      id: 1,
      name: 'Bulbasaur',
      spriteUrl: 'https://img.test/1.png',
      children: [
        {
          id: 2,
          name: 'Ivysaur',
          spriteUrl: 'https://img.test/2.png',
          children: [
            { id: 3, name: 'Venusaur', spriteUrl: 'https://img.test/3.png', children: [] },
          ],
        },
      ],
    },
    varieties: [
      { pokemonId: id, name: nameOf(id), isDefault: true, spriteUrl: `https://img.test/${id}.png` },
    ],
    prevId: id > 1 ? id - 1 : null,
    nextId: id < 1025 ? id + 1 : null,
    fallbackLanguage: lang !== 'en',
  };
}

/** Routes every backend and image request of the page to the fake BFF. Returns the API requests seen. */
export async function mockApi(page: Page): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route('https://img.test/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  );
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
  await page.route('**/actuator/health', (route) => route.fulfill({ json: { status: 'UP' } }));
  await page.route('**/api/v1/**', (route) => {
    const request = route.request();
    requests.push(request);
    const url = new URL(request.url());
    const lang = url.searchParams.get('lang') ?? 'en';
    if (url.pathname.endsWith('/types')) {
      return route.fulfill({
        json: Object.entries(TYPE_NAMES[lang] ?? TYPE_NAMES['en']).map(([key, name]) => ({
          key,
          name,
        })),
      });
    }
    const match = url.pathname.match(/\/pokemon\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);
      return id > 1025 && id < 10000
        ? route.fulfill({
            status: 404,
            json: {
              type: 'about:blank',
              title: 'Not Found',
              status: 404,
              detail: 'No Pokémon',
              instance: url.pathname,
            },
          })
        : route.fulfill({ json: detail(id, lang) });
    }
    return route.fulfill({ json: list(url) });
  });
  return requests;
}

/** `test` with the API mocked and the list of API requests available as `apiRequests`. */
export const test = base.extend<{ apiRequests: Request[] }>({
  apiRequests: [
    async ({ page }, use) => {
      await use(await mockApi(page));
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

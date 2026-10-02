import { routes } from './app.routes';

describe('routes', () => {
  it('is defined', () => {
    expect(Array.isArray(routes)).toBe(true);
  });
});

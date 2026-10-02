import { DEFAULT_LIST_QUERY, sanitizeListQuery, toQueryParams } from './list-query';

describe('sanitizeListQuery', () => {
  it('returns defaults for an empty query', () => {
    expect(sanitizeListQuery({})).toEqual(DEFAULT_LIST_QUERY);
  });

  it('keeps valid values', () => {
    expect(
      sanitizeListQuery({ page: '3', q: ' pika ', type: 'electric', sort: 'name', dir: 'desc' }),
    ).toEqual({
      page: 3,
      q: 'pika',
      type: 'electric',
      sort: 'name',
      dir: 'desc',
    });
  });

  it.each([['-1'], ['1.5'], ['abc'], ['99999']])('rejects page %s', (page) => {
    expect(sanitizeListQuery({ page }).page).toBe(0);
  });

  it('rejects invalid type, sort and dir, and truncates long searches', () => {
    const query = sanitizeListQuery({
      type: '<script>',
      sort: 'weight',
      dir: 'up',
      q: 'x'.repeat(80),
    });
    expect(query.type).toBe('');
    expect(query.sort).toBe('number');
    expect(query.dir).toBe('asc');
    expect(query.q).toHaveLength(50);
  });
});

describe('toQueryParams', () => {
  it('drops defaults from the URL and keeps the rest', () => {
    expect(toQueryParams({ page: 0, q: 'bulba', sort: 'number', dir: 'desc' })).toEqual({
      page: null,
      q: 'bulba',
      sort: null,
      dir: 'desc',
    });
  });
});

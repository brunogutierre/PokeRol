import { TestBed } from '@angular/core/testing';
import { DEFAULT_LIST_QUERY } from './api/list-query';
import { ListState } from './list-state';

describe('ListState', () => {
  it('exposes the last list query as default-free query params', () => {
    const state = TestBed.inject(ListState);
    expect(state.queryParams()).toEqual({});
    state.remember({ ...DEFAULT_LIST_QUERY, page: 3, type: 'fire' });
    expect(state.queryParams()).toEqual({ page: 3, type: 'fire' });
  });
});

import { Item } from '../models/models';
import {
  defaultSearchName,
  matchesFilter,
  nextItemNo,
  placeLabel,
  sameFilter,
  withinRange,
} from './matching';

// Pure functions are the easiest thing to test: input in, output out.

const item = (overrides: Partial<Item> = {}): Item => ({
  no: '0412',
  title: 'AirPods Pro case, white',
  category: 'Electronics',
  place: 'Library',
  placeDetail: '2nd floor',
  held: 'With finder',
  foundAt: new Date().toISOString(),
  description: 'Has a sticker on the back',
  photos: [],
  finderId: 'u2',
  status: 'open',
  ...overrides,
});

describe('matchesFilter', () => {
  it('matches everything with an empty filter', () => {
    expect(matchesFilter(item(), { category: 'All', places: [] })).toBe(true);
  });

  it('filters by category', () => {
    expect(matchesFilter(item(), { category: 'Keys', places: [] })).toBe(false);
    expect(matchesFilter(item(), { category: 'Electronics', places: [] })).toBe(true);
  });

  it('matches any of the selected places', () => {
    expect(matchesFilter(item(), { category: 'All', places: ['Dorms', 'Library'] })).toBe(true);
    expect(matchesFilter(item(), { category: 'All', places: ['Dorms'] })).toBe(false);
  });

  it('searches title and description, case-insensitive', () => {
    expect(matchesFilter(item(), { category: 'All', places: [], query: 'AIRPODS' })).toBe(true);
    expect(matchesFilter(item(), { category: 'All', places: [], query: 'sticker' })).toBe(true);
    expect(matchesFilter(item(), { category: 'All', places: [], query: 'wallet' })).toBe(false);
  });
});

describe('withinRange', () => {
  const now = Date.parse('2026-09-30T12:00:00Z');

  it('keeps items inside the range', () => {
    const twoDaysAgo = item({ foundAt: '2026-09-28T12:00:00Z' });
    expect(withinRange(twoDaysAgo, 'today', now)).toBe(false);
    expect(withinRange(twoDaysAgo, 'week', now)).toBe(true);
  });
});

describe('sameFilter', () => {
  it('ignores place order and query case', () => {
    expect(
      sameFilter(
        { category: 'Keys', places: ['Dorms', 'Library'], query: 'Red' },
        { category: 'Keys', places: ['Library', 'Dorms'], query: 'red ' },
      ),
    ).toBe(true);
  });
});

describe('helpers', () => {
  it('names a search after its query, then its category', () => {
    expect(defaultSearchName({ category: 'Keys', places: [], query: 'red lanyard' })).toBe(
      'Red lanyard',
    );
    expect(defaultSearchName({ category: 'Keys', places: [] })).toBe('Keys');
  });

  it('builds "place · detail" labels', () => {
    expect(placeLabel({ place: 'Library', placeDetail: '2nd floor' })).toBe('Library · 2nd floor');
    expect(placeLabel({ place: 'Canteen' })).toBe('Canteen');
  });

  it('computes the next zero-padded Nº', () => {
    expect(nextItemNo([item({ no: '0412' }), item({ no: '0099' })])).toBe('0413');
    expect(nextItemNo([])).toBe('0001');
  });
});

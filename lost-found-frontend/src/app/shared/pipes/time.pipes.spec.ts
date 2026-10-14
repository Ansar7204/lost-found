import { timeAgo, whenLabel } from './time.pipes';

describe('timeAgo', () => {
  const now = Date.parse('2026-09-30T12:00:00');
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const H = 3_600_000;

  it.each([
    [ago(10_000), 'JUST NOW'],
    [ago(5 * 60_000), '5M AGO'],
    [ago(2 * H), '2H AGO'],
    [ago(30 * H), 'YESTERDAY'],
    [ago(3 * 24 * H), '3 DAYS'],
    ['2026-09-12T10:00:00', 'SEP 12'],
  ])('%s -> %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});

describe('whenLabel', () => {
  const now = new Date('2026-09-30T15:00:00');

  it('says Today / Yesterday / date', () => {
    expect(whenLabel('2026-09-30T11:30:00', now)).toBe('Today, 11:30');
    expect(whenLabel('2026-09-29T09:05:00', now)).toBe('Yesterday, 09:05');
    expect(whenLabel('2026-09-21T14:00:00', now)).toBe('Sep 21, 14:00');
  });
});
